package com.adoptapet.adoptionservice.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.adoptapet.adoptionservice.model.DeliveryAppointment;

public interface AppointmentRepository extends JpaRepository<DeliveryAppointment, Long> {

	Optional<DeliveryAppointment> findByApplicationId(Long applicationId);

	List<DeliveryAppointment> findByApplicationIdIn(Collection<Long> applicationIds);
}
