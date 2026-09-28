package com.adoptapet.adoptionservice.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import com.adoptapet.adoptionservice.model.AdoptionApplication;
import com.adoptapet.adoptionservice.model.ApplicationStatus;

import jakarta.persistence.LockModeType;

public interface ApplicationRepository extends JpaRepository<AdoptionApplication, Long> {

	List<AdoptionApplication> findAllByOrderByIdDesc();

	List<AdoptionApplication> findByStatusOrderByIdDesc(ApplicationStatus status);

	List<AdoptionApplication> findByAdopterIdOrderByIdDesc(Long adopterId);

	boolean existsByAdopterIdAndPetIdAndStatus(Long adopterId, Long petId, ApplicationStatus status);

	boolean existsByPetIdAndStatusIn(Long petId, Collection<ApplicationStatus> statuses);

	boolean existsByPetIdAndStatusInAndIdNot(Long petId, Collection<ApplicationStatus> statuses, Long id);

	List<AdoptionApplication> findByPetIdAndStatusAndIdNot(Long petId, ApplicationStatus status, Long id);

	/**
	 * Locks every application of a pet until the transaction ends, so two staff members
	 * cannot approve two different applications for the same pet at the same time.
	 */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	List<AdoptionApplication> findForUpdateByPetId(Long petId);
}
