package com.adoptapet.adoptionservice.service;

import java.io.IOException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.adoptapet.adoptionservice.client.PetClient;
import com.adoptapet.adoptionservice.client.PetInfo;
import com.adoptapet.adoptionservice.client.UserClient;
import com.adoptapet.adoptionservice.dto.ApplicationRequest;
import com.adoptapet.adoptionservice.dto.ApplicationResponse;
import com.adoptapet.adoptionservice.dto.ScheduleRequest;
import com.adoptapet.adoptionservice.messaging.AdoptionEventPublisher;
import com.adoptapet.adoptionservice.model.AdoptionApplication;
import com.adoptapet.adoptionservice.model.ApplicationStatus;
import com.adoptapet.adoptionservice.model.AppointmentStatus;
import com.adoptapet.adoptionservice.model.DeliveryAppointment;
import com.adoptapet.adoptionservice.model.DeliverySlot;
import com.adoptapet.adoptionservice.model.DocumentType;
import com.adoptapet.adoptionservice.pdf.ActPdfGenerator;
import com.adoptapet.adoptionservice.repository.ApplicationRepository;
import com.adoptapet.adoptionservice.repository.AppointmentRepository;
import com.adoptapet.shared.event.EventTypes;
import com.adoptapet.shared.exception.ApiException;
import com.adoptapet.shared.security.AuthUser;

import lombok.RequiredArgsConstructor;

/**
 * Adoption workflow (replaces SolicitudService).
 *
 * PENDING --approve--> APPROVED --complete--> COMPLETED
 *    |                   |  ^  \--no-show--> NO_SHOW --reschedule--> APPROVED
 *    +--reject--> REJECTED   \---------cancel (APPROVED | NO_SHOW)--> CANCELLED
 *
 * Only an approved application reserves the pet. pet-service follows the status through RabbitMQ.
 */
@Service
@RequiredArgsConstructor
public class ApplicationService {

	private static final int MAX_RESCHEDULES = 2;
	/** Statuses in which the pet is already promised to someone. */
	private static final List<ApplicationStatus> PET_TAKEN = List.of(
			ApplicationStatus.APPROVED, ApplicationStatus.NO_SHOW, ApplicationStatus.COMPLETED);

	private final ApplicationRepository applicationRepository;
	private final AppointmentRepository appointmentRepository;
	private final DeliverySlotService slotService;
	private final DocumentStorageService storage;
	private final AdoptionEventPublisher events;
	private final PetClient petClient;
	private final UserClient userClient;
	private final ActPdfGenerator actPdfGenerator;
	private final Clock clock;

	// ---------------------------------------------------------------- queries

	@Transactional(readOnly = true)
	public List<ApplicationResponse> findAll(ApplicationStatus status) {
		return toResponses(status == null
				? applicationRepository.findAllByOrderByIdDesc()
				: applicationRepository.findByStatusOrderByIdDesc(status));
	}

	@Transactional(readOnly = true)
	public List<ApplicationResponse> findByAdopter(Long adopterId) {
		return toResponses(applicationRepository.findByAdopterIdOrderByIdDesc(adopterId));
	}

	@Transactional(readOnly = true)
	public ApplicationResponse findById(Long id, AuthUser user) {
		AdoptionApplication application = getApplication(id);
		requireOwnerOrStaff(application, user);
		return toResponse(application);
	}

	@Transactional(readOnly = true)
	public Resource getDocument(Long id, DocumentType type, AuthUser user) {
		AdoptionApplication application = getApplication(id);
		requireOwnerOrStaff(application, user);

		String fileName = switch (type) {
			case DNI -> application.getDniFile();
			case ADDRESS_PROOF -> application.getAddressProofFile();
			case ACT -> application.getActFile();
			case SIGNED_ACT -> application.getSignedActFile();
		};
		return storage.load(fileName);
	}

	// ---------------------------------------------------------------- adopter

	@Transactional
	public ApplicationResponse register(ApplicationRequest request, MultipartFile dniFile, MultipartFile addressProofFile,
			AuthUser adopter) {

		PetInfo pet = petClient.getPet(request.getPetId());
		if (!pet.isAvailable()) {
			throw ApiException.conflict("The pet is not available for adoption");
		}
		if (!pet.isHealthy()) {
			throw ApiException.conflict("The pet is not fit for adoption right now");
		}
		if (applicationRepository.existsByAdopterIdAndPetIdAndStatus(adopter.getId(), pet.getId(), ApplicationStatus.PENDING)) {
			throw ApiException.conflict("You already have a pending application for this pet");
		}
		if (applicationRepository.existsByPetIdAndStatusIn(pet.getId(), PET_TAKEN)) {
			throw ApiException.conflict("The pet already has an approved or completed adoption");
		}
		if (isEmpty(dniFile) || isEmpty(addressProofFile)) {
			throw ApiException.badRequest("The DNI and the proof of address are required");
		}

		AdoptionApplication application = new AdoptionApplication();
		application.setAdopterId(adopter.getId());
		application.setPetId(pet.getId());
		application.setPetName(pet.getName());
		application.setPetSpecies(pet.getSpecies());
		application.setStatus(ApplicationStatus.PENDING);
		application.setAdoptionReason(request.getAdoptionReason());
		application.setHousingType(request.getHousingType());
		application.setPetExperience(request.getPetExperience());
		application.setOtherPets(request.getOtherPets());
		application.setHouseholdSize(request.getHouseholdSize());
		application.setComments(request.getComments());
		application.setRescheduleCount(0);
		application.setDniFile(storage.save(dniFile, "dni"));
		application.setAddressProofFile(storage.save(addressProofFile, "address"));

		application = applicationRepository.save(application);
		events.publish(EventTypes.CREATED, application, null, null);
		return toResponse(application, null);
	}

	// ---------------------------------------------------------------- staff

	@Transactional
	public ApplicationResponse approve(Long id, ScheduleRequest schedule, AuthUser worker) {
		AdoptionApplication application = getApplication(id);
		requireStatus(application, "Only pending applications can be approved", ApplicationStatus.PENDING);

		// Serialize approvals of the same pet, then check nobody got it first.
		applicationRepository.findForUpdateByPetId(application.getPetId());
		if (applicationRepository.existsByPetIdAndStatusInAndIdNot(application.getPetId(), PET_TAKEN, id)) {
			throw ApiException.conflict("The pet already has an approved or completed adoption");
		}

		PetInfo pet = petClient.getPet(application.getPetId());
		if (!pet.isHealthy()) {
			throw ApiException.conflict("The pet is not fit for adoption right now");
		}
		if ("ADOPTED".equals(pet.getAdoptionStatus()) || "INACTIVE".equals(pet.getAdoptionStatus())) {
			throw ApiException.conflict("The pet is no longer available");
		}

		slotService.validate(schedule);
		DeliverySlot slot = slotService.reserve(schedule.getDeliveryDate(), schedule.getStartTime(), schedule.getEndTime());

		DeliveryAppointment appointment = new DeliveryAppointment();
		appointment.setApplication(application);
		applySchedule(appointment, slot, schedule);
		appointmentRepository.save(appointment);

		application.setStatus(ApplicationStatus.APPROVED);
		application.setWorkerId(worker.getId());
		applicationRepository.save(application);
		events.publish(EventTypes.APPROVED, application, appointment, null);

		rejectOtherPending(application);
		return toResponse(application, appointment);
	}

	@Transactional
	public ApplicationResponse reject(Long id, String reason) {
		AdoptionApplication application = getApplication(id);
		requireStatus(application, "Only pending applications can be rejected", ApplicationStatus.PENDING);

		application.setStatus(ApplicationStatus.REJECTED);
		application.setRejectionReason(reason.trim());
		applicationRepository.save(application);
		events.publish(EventTypes.REJECTED, application, null, application.getRejectionReason());
		return toResponse(application, null);
	}

	@Transactional
	public ApplicationResponse markNoShow(Long id) {
		AdoptionApplication application = getApplication(id);
		requireStatus(application, "Only approved applications can be marked as no-show", ApplicationStatus.APPROVED);
		DeliveryAppointment appointment = getAppointment(id);

		if (appointment.getStatus() != AppointmentStatus.SCHEDULED) {
			throw ApiException.conflict("Only scheduled appointments can be marked as no-show");
		}
		if (now().isBefore(LocalDateTime.of(appointment.getDeliveryDate(), appointment.getEndTime()))) {
			throw ApiException.conflict("No-show can only be marked after the delivery window ends");
		}

		application.setStatus(ApplicationStatus.NO_SHOW);
		appointment.setStatus(AppointmentStatus.NO_SHOW);
		applicationRepository.save(application);
		appointmentRepository.save(appointment);
		events.publish(EventTypes.NO_SHOW, application, appointment, null);
		return toResponse(application, appointment);
	}

	@Transactional
	public ApplicationResponse reschedule(Long id, ScheduleRequest schedule, AuthUser user) {
		AdoptionApplication application = getApplication(id);
		requireStatus(application, "Only approved or no-show applications can be rescheduled",
				ApplicationStatus.APPROVED, ApplicationStatus.NO_SHOW);

		if (application.getRescheduleCount() >= MAX_RESCHEDULES) {
			if (!user.isAdmin()) {
				throw ApiException.conflict("The application reached the limit of " + MAX_RESCHEDULES
						+ " reschedules. An administrator must cancel it or authorize an exception");
			}
			if (schedule.getObservation() == null || schedule.getObservation().isBlank()) {
				throw ApiException.badRequest("An extra reschedule requires an observation from the administrator");
			}
		}

		DeliveryAppointment appointment = getAppointment(id);
		if (appointment.getStatus() == AppointmentStatus.COMPLETED || appointment.getStatus() == AppointmentStatus.CANCELLED) {
			throw ApiException.conflict("A completed or cancelled appointment cannot be rescheduled");
		}

		slotService.validate(schedule);
		slotService.release(appointment.getSlot());
		DeliverySlot slot = slotService.reserve(schedule.getDeliveryDate(), schedule.getStartTime(), schedule.getEndTime());
		applySchedule(appointment, slot, schedule);
		appointment.setCancellationReason(null);
		appointmentRepository.save(appointment);

		application.setStatus(ApplicationStatus.APPROVED);
		application.setRescheduleCount(application.getRescheduleCount() + 1);
		applicationRepository.save(application);
		events.publish(EventTypes.RESCHEDULED, application, appointment, schedule.getObservation());
		return toResponse(application, appointment);
	}

	@Transactional
	public ApplicationResponse cancel(Long id, String reason) {
		AdoptionApplication application = getApplication(id);
		requireStatus(application, "Only approved or no-show applications can be cancelled",
				ApplicationStatus.APPROVED, ApplicationStatus.NO_SHOW);

		DeliveryAppointment appointment = appointmentRepository.findByApplicationId(id).orElse(null);
		if (appointment != null) {
			if (appointment.getStatus() == AppointmentStatus.SCHEDULED || appointment.getStatus() == AppointmentStatus.NO_SHOW) {
				slotService.release(appointment.getSlot());
			}
			appointment.setStatus(AppointmentStatus.CANCELLED);
			appointment.setCancellationReason(reason.trim());
			appointmentRepository.save(appointment);
		}

		application.setStatus(ApplicationStatus.CANCELLED);
		application.setCancellationReason(reason.trim());
		applicationRepository.save(application);
		events.publish(EventTypes.CANCELLED, application, appointment, application.getCancellationReason());
		return toResponse(application, appointment);
	}

	/** Generates (or regenerates) the adoption act PDF and returns it. */
	@Transactional
	public byte[] generateAct(Long id, AuthUser worker) {
		AdoptionApplication application = getApplication(id);
		requireStatus(application, "The act can only be generated for approved applications", ApplicationStatus.APPROVED);
		DeliveryAppointment appointment = getAppointment(id);

		if (application.getWorkerId() == null) {
			application.setWorkerId(worker.getId());
		}

		try {
			byte[] pdf = actPdfGenerator.generate(application, appointment,
					userClient.getUser(application.getAdopterId()),
					petClient.getPet(application.getPetId()),
					userClient.getUser(application.getWorkerId()));
			application.setActFile(storage.save(pdf, "act_" + id + ".pdf"));
			applicationRepository.save(application);
			return pdf;
		} catch (IOException e) {
			throw new IllegalStateException("Could not generate the adoption act", e);
		}
	}

	@Transactional
	public ApplicationResponse uploadSignedAct(Long id, MultipartFile file) {
		AdoptionApplication application = getApplication(id);
		requireStatus(application, "The signed act can only be uploaded for approved applications", ApplicationStatus.APPROVED);
		if (application.getActFile() == null) {
			throw ApiException.conflict("Generate the adoption act first");
		}
		DeliveryAppointment appointment = getAppointment(id);
		requireDeliveryStarted(appointment, "The signed act can only be uploaded once the delivery window starts");

		application.setSignedActFile(storage.save(file, "signed_act"));
		applicationRepository.save(application);
		return toResponse(application, appointment);
	}

	@Transactional
	public ApplicationResponse complete(Long id, AuthUser worker) {
		AdoptionApplication application = getApplication(id);
		DeliveryAppointment appointment = checkReadyToComplete(application);

		requireDeliveryStarted(appointment, "The adoption cannot be completed before the delivery window");
		if (now().isAfter(appointment.getPickupDeadline())) {
			throw ApiException.conflict("The pickup deadline has passed. Cancel the adoption with a reason, "
					+ "or an administrator can close it by contingency");
		}
		return close(application, appointment, worker, null);
	}

	/** Admin only: close an adoption whose normal pickup deadline already passed. */
	@Transactional
	public ApplicationResponse completeByContingency(Long id, String reason, AuthUser admin) {
		AdoptionApplication application = getApplication(id);
		DeliveryAppointment appointment = checkReadyToComplete(application);

		requireDeliveryStarted(appointment, "The adoption cannot be completed before the delivery window");
		if (!now().isAfter(appointment.getPickupDeadline())) {
			throw ApiException.conflict("Contingency only applies once the normal pickup deadline has passed");
		}

		application.setContingencyReason(reason.trim());
		application.setContingencyClosedAt(now());
		return close(application, appointment, admin, application.getContingencyReason());
	}

	// ---------------------------------------------------------------- helpers

	private DeliveryAppointment checkReadyToComplete(AdoptionApplication application) {
		requireStatus(application, "Only approved applications can be completed", ApplicationStatus.APPROVED);
		if (application.getActFile() == null) {
			throw ApiException.conflict("Generate the adoption act before completing the adoption");
		}
		if (application.getSignedActFile() == null) {
			throw ApiException.conflict("Upload the signed act before completing the adoption");
		}
		if (applicationRepository.existsByPetIdAndStatusInAndIdNot(application.getPetId(),
				List.of(ApplicationStatus.COMPLETED), application.getId())) {
			throw ApiException.conflict("This pet already has a completed adoption");
		}
		if (!petClient.getPet(application.getPetId()).isHealthy()) {
			throw ApiException.conflict("The adoption cannot be completed because the pet is not fit");
		}
		return getAppointment(application.getId());
	}

	private ApplicationResponse close(AdoptionApplication application, DeliveryAppointment appointment, AuthUser user,
			String reason) {
		if (application.getWorkerId() == null) {
			application.setWorkerId(user.getId());
		}
		application.setStatus(ApplicationStatus.COMPLETED);
		appointment.setStatus(AppointmentStatus.COMPLETED);
		appointmentRepository.save(appointment);
		applicationRepository.save(application);
		events.publish(EventTypes.COMPLETED, application, appointment, reason);
		return toResponse(application, appointment);
	}

	/** When one application is approved, the other pending ones for the same pet are rejected. */
	private void rejectOtherPending(AdoptionApplication approved) {
		List<AdoptionApplication> others = applicationRepository.findByPetIdAndStatusAndIdNot(
				approved.getPetId(), ApplicationStatus.PENDING, approved.getId());
		for (AdoptionApplication other : others) {
			other.setStatus(ApplicationStatus.REJECTED);
			other.setRejectionReason("Another application was approved for this pet");
			applicationRepository.save(other);
			events.publish(EventTypes.REJECTED, other, null, other.getRejectionReason());
		}
	}

	private void applySchedule(DeliveryAppointment appointment, DeliverySlot slot, ScheduleRequest schedule) {
		appointment.setSlot(slot);
		appointment.setDeliveryDate(schedule.getDeliveryDate());
		appointment.setStartTime(schedule.getStartTime());
		appointment.setEndTime(schedule.getEndTime());
		appointment.setPickupDeadline(slotService.pickupDeadline(schedule));
		appointment.setObservation(schedule.getObservation());
		appointment.setStatus(AppointmentStatus.SCHEDULED);
	}

	private void requireDeliveryStarted(DeliveryAppointment appointment, String message) {
		if (now().isBefore(LocalDateTime.of(appointment.getDeliveryDate(), appointment.getStartTime()))) {
			throw ApiException.conflict(message);
		}
	}

	private void requireStatus(AdoptionApplication application, String message, ApplicationStatus... allowed) {
		for (ApplicationStatus status : allowed) {
			if (application.getStatus() == status) {
				return;
			}
		}
		throw ApiException.conflict(message);
	}

	private void requireOwnerOrStaff(AdoptionApplication application, AuthUser user) {
		if (!user.isStaff() && !application.getAdopterId().equals(user.getId())) {
			throw ApiException.forbidden("You can only access your own applications");
		}
	}

	private AdoptionApplication getApplication(Long id) {
		return applicationRepository.findById(id).orElseThrow(() -> ApiException.notFound("Application not found"));
	}

	private DeliveryAppointment getAppointment(Long applicationId) {
		return appointmentRepository.findByApplicationId(applicationId)
				.orElseThrow(() -> ApiException.conflict("The application has no delivery appointment"));
	}

	private LocalDateTime now() {
		return LocalDateTime.now(clock);
	}

	private boolean isEmpty(MultipartFile file) {
		return file == null || file.isEmpty();
	}

	private ApplicationResponse toResponse(AdoptionApplication application) {
		return toResponse(application, appointmentRepository.findByApplicationId(application.getId()).orElse(null));
	}

	private ApplicationResponse toResponse(AdoptionApplication application, DeliveryAppointment appointment) {
		return ApplicationResponse.from(application, appointment);
	}

	/** Loads all appointments of the list in one query instead of one per application. */
	private List<ApplicationResponse> toResponses(List<AdoptionApplication> applications) {
		if (applications.isEmpty()) {
			return List.of();
		}
		Map<Long, DeliveryAppointment> appointments = appointmentRepository
				.findByApplicationIdIn(applications.stream().map(AdoptionApplication::getId).toList())
				.stream()
				.collect(Collectors.toMap(a -> a.getApplication().getId(), Function.identity()));

		return applications.stream()
				.map(a -> ApplicationResponse.from(a, appointments.get(a.getId())))
				.toList();
	}
}
