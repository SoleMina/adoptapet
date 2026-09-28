package com.adoptapet.adoptionservice.dto;

import java.time.LocalDateTime;

import com.adoptapet.adoptionservice.model.AdoptionApplication;
import com.adoptapet.adoptionservice.model.DeliveryAppointment;

import lombok.Data;

/** Files are never returned here, only whether they exist. Download them from /documents/{type}. */
@Data
public class ApplicationResponse {

	private Long id;
	private Long adopterId;
	private Long petId;
	private String petName;
	private String petSpecies;
	private Long workerId;
	private String status;
	private String adoptionReason;
	private String housingType;
	private String petExperience;
	private String otherPets;
	private Integer householdSize;
	private String comments;
	private String rejectionReason;
	private String cancellationReason;
	private String contingencyReason;
	private LocalDateTime contingencyClosedAt;
	private Integer rescheduleCount;
	private boolean hasDni;
	private boolean hasAddressProof;
	private boolean hasAct;
	private boolean hasSignedAct;
	private AppointmentResponse appointment;
	private Long version;
	private LocalDateTime createdAt;

	public static ApplicationResponse from(AdoptionApplication application, DeliveryAppointment appointment) {
		ApplicationResponse response = new ApplicationResponse();
		response.setId(application.getId());
		response.setAdopterId(application.getAdopterId());
		response.setPetId(application.getPetId());
		response.setPetName(application.getPetName());
		response.setPetSpecies(application.getPetSpecies());
		response.setWorkerId(application.getWorkerId());
		response.setStatus(application.getStatus().name());
		response.setAdoptionReason(application.getAdoptionReason());
		response.setHousingType(application.getHousingType());
		response.setPetExperience(application.getPetExperience());
		response.setOtherPets(application.getOtherPets());
		response.setHouseholdSize(application.getHouseholdSize());
		response.setComments(application.getComments());
		response.setRejectionReason(application.getRejectionReason());
		response.setCancellationReason(application.getCancellationReason());
		response.setContingencyReason(application.getContingencyReason());
		response.setContingencyClosedAt(application.getContingencyClosedAt());
		response.setRescheduleCount(application.getRescheduleCount());
		response.setHasDni(application.getDniFile() != null);
		response.setHasAddressProof(application.getAddressProofFile() != null);
		response.setHasAct(application.getActFile() != null);
		response.setHasSignedAct(application.getSignedActFile() != null);
		response.setAppointment(AppointmentResponse.from(appointment));
		response.setVersion(application.getVersion());
		response.setCreatedAt(application.getCreatedAt());
		return response;
	}
}
