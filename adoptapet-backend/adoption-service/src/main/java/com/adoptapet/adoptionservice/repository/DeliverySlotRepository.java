package com.adoptapet.adoptionservice.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import com.adoptapet.adoptionservice.model.DeliverySlot;

import jakarta.persistence.LockModeType;

public interface DeliverySlotRepository extends JpaRepository<DeliverySlot, Long> {

	List<DeliverySlot> findByDeliveryDate(LocalDate deliveryDate);

	boolean existsByDeliveryDateAndStartTimeAndEndTime(LocalDate deliveryDate, LocalTime startTime, LocalTime endTime);

	/** Locked read: the capacity check and the +1/-1 happen without another booking in between. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<DeliverySlot> findForUpdateByDeliveryDateAndStartTimeAndEndTime(LocalDate deliveryDate,
			LocalTime startTime, LocalTime endTime);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<DeliverySlot> findForUpdateById(Long id);
}
