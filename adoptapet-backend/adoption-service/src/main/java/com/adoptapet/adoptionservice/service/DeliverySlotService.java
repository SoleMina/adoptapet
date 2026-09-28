package com.adoptapet.adoptionservice.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.adoptapet.adoptionservice.dto.ScheduleRequest;
import com.adoptapet.adoptionservice.dto.SlotAvailabilityResponse;
import com.adoptapet.adoptionservice.model.DeliverySlot;
import com.adoptapet.adoptionservice.repository.DeliverySlotRepository;
import com.adoptapet.shared.exception.ApiException;

/** Delivery windows and their capacity (max 2 deliveries per window). */
@Service
public class DeliverySlotService {

	public static final int CAPACITY_PER_WINDOW = 2;
	private static final int PICKUP_TOLERANCE_MINUTES = 30;

	private static final List<LocalTime[]> WINDOWS = List.of(
			new LocalTime[] { LocalTime.of(10, 0), LocalTime.of(12, 0) },
			new LocalTime[] { LocalTime.of(14, 0), LocalTime.of(16, 0) },
			new LocalTime[] { LocalTime.of(16, 0), LocalTime.of(18, 0) });

	private final DeliverySlotRepository repository;
	private final Clock clock;
	private final TransactionTemplate newTransaction;

	public DeliverySlotService(DeliverySlotRepository repository, Clock clock, PlatformTransactionManager transactionManager) {
		this.repository = repository;
		this.clock = clock;
		this.newTransaction = new TransactionTemplate(transactionManager);
		this.newTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
	}

	@Transactional(readOnly = true)
	public List<SlotAvailabilityResponse> availability(LocalDate date) {
		List<DeliverySlot> slots = repository.findByDeliveryDate(date);
		LocalDateTime now = LocalDateTime.now(clock);

		return WINDOWS.stream().map(window -> {
			DeliverySlot slot = slots.stream()
					.filter(s -> s.getStartTime().equals(window[0]) && s.getEndTime().equals(window[1]))
					.findFirst().orElse(null);
			int capacity = slot == null ? CAPACITY_PER_WINDOW : slot.getCapacity();
			int reserved = slot == null ? 0 : slot.getReserved();
			int free = Math.max(0, capacity - reserved);
			boolean expired = !LocalDateTime.of(date, window[0]).isAfter(now);
			return new SlotAvailabilityResponse(window[0] + " - " + window[1], window[0], window[1],
					capacity, reserved, free, free > 0 && !expired, expired);
		}).toList();
	}

	public void validate(ScheduleRequest request) {
		if (WINDOWS.stream().noneMatch(w -> w[0].equals(request.getStartTime()) && w[1].equals(request.getEndTime()))) {
			throw ApiException.badRequest("The delivery window must be 10:00-12:00, 14:00-16:00 or 16:00-18:00");
		}
		LocalDateTime start = LocalDateTime.of(request.getDeliveryDate(), request.getStartTime());
		if (!start.isAfter(LocalDateTime.now(clock))) {
			throw ApiException.badRequest("The delivery window has already started or passed");
		}
		if (request.getPickupDeadline().isBefore(start)) {
			throw ApiException.badRequest("The pickup deadline cannot be before the delivery window");
		}
	}

	/** The deadline is at least the end of the window plus the tolerance. */
	public LocalDateTime pickupDeadline(ScheduleRequest request) {
		LocalDateTime minimum = LocalDateTime.of(request.getDeliveryDate(), request.getEndTime())
				.plusMinutes(PICKUP_TOLERANCE_MINUTES);
		return request.getPickupDeadline().isBefore(minimum) ? minimum : request.getPickupDeadline();
	}

	/** Must run inside the caller's transaction: the slot row stays locked until it commits. */
	@Transactional
	public DeliverySlot reserve(LocalDate date, LocalTime start, LocalTime end) {
		// Plain (non-locking) check first: a locked read of a missing row would lock the index gap
		// and block our own insert below.
		if (!repository.existsByDeliveryDateAndStartTimeAndEndTime(date, start, end)) {
			createInNewTransaction(date, start, end);
		}
		DeliverySlot slot = repository.findForUpdateByDeliveryDateAndStartTimeAndEndTime(date, start, end)
				.orElseThrow(() -> ApiException.conflict("Could not book the delivery window, try again"));

		if (slot.getReserved() >= slot.getCapacity()) {
			throw ApiException.conflict("This delivery window is full. Choose another one");
		}
		slot.setReserved(slot.getReserved() + 1);
		return repository.save(slot);
	}

	@Transactional
	public void release(DeliverySlot slot) {
		DeliverySlot locked = repository.findForUpdateById(slot.getId()).orElse(slot);
		locked.setReserved(Math.max(0, locked.getReserved() - 1));
		repository.save(locked);
	}

	/**
	 * The slot row is created in its own short transaction. If another request created it first,
	 * the unique constraint fails there and the caller simply locks the existing row.
	 */
	private void createInNewTransaction(LocalDate date, LocalTime start, LocalTime end) {
		try {
			newTransaction.executeWithoutResult(status -> {
				DeliverySlot slot = new DeliverySlot();
				slot.setDeliveryDate(date);
				slot.setStartTime(start);
				slot.setEndTime(end);
				slot.setCapacity(CAPACITY_PER_WINDOW);
				slot.setReserved(0);
				repository.saveAndFlush(slot);
			});
		} catch (DataIntegrityViolationException alreadyCreated) {
			// another request created the same slot first: fine
		}
	}
}
