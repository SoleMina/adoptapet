package com.adoptapet.adoptionservice.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Data;

/**
 * Replaces Solicitud. The adopter, worker and pet live in other services, so only their ids are stored
 * (plus the pet name/species so lists and reports do not need to call pet-service for every row).
 */
@Entity
@Table(name = "applications", indexes = {
		@Index(name = "ix_application_pet", columnList = "pet_id"),
		@Index(name = "ix_application_adopter", columnList = "adopter_id"),
		@Index(name = "ix_application_status", columnList = "status")
})
@Data
public class AdoptionApplication {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "adopter_id", nullable = false)
	private Long adopterId;

	@Column(name = "pet_id", nullable = false)
	private Long petId;

	@Column(length = 50)
	private String petName;

	@Column(length = 30)
	private String petSpecies;

	/** Staff member responsible for the adoption, set when it is approved. */
	private Long workerId;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private ApplicationStatus status;

	// Adoption form
	@Column(nullable = false, length = 1000)
	private String adoptionReason;

	@Column(nullable = false, length = 100)
	private String housingType;

	@Column(nullable = false, length = 1000)
	private String petExperience;

	@Column(length = 500)
	private String otherPets;

	@Column(nullable = false)
	private Integer householdSize;

	@Column(length = 1000)
	private String comments;

	// Closing reasons
	@Column(length = 500)
	private String rejectionReason;

	@Column(length = 500)
	private String cancellationReason;

	@Column(length = 500)
	private String contingencyReason;

	private LocalDateTime contingencyClosedAt;

	@Column(nullable = false)
	private Integer rescheduleCount = 0;

	// Stored file names inside app.storage.documents
	private String dniFile;

	private String addressProofFile;

	private String actFile;

	private String signedActFile;

	@Version
	private Long version;

	@CreationTimestamp
	@Column(updatable = false)
	private LocalDateTime createdAt;

	@UpdateTimestamp
	private LocalDateTime updatedAt;
}
