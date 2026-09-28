package com.adoptapet.petservice.model;

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
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Data;

@Entity
@Table(name = "pets")
@Data
public class Pet {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 50)
	private String name;

	@Column(nullable = false, length = 30)
	private String species;

	@Column(length = 50)
	private String breed;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private Sex sex;

	private Integer ageYears;

	private Integer ageMonths;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private HealthStatus healthStatus;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private SterilizationStatus sterilizationStatus;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private AdoptionStatus adoptionStatus = AdoptionStatus.AVAILABLE;

	@Column(length = 500)
	private String observations;

	/** File name inside app.storage.pet-images, served at /api/pets/images/{imageName}. */
	private String imageName;

	/** Optimistic locking: two staff members cannot overwrite each other's changes. */
	@Version
	private Long version;

	@CreationTimestamp
	@Column(updatable = false)
	private LocalDateTime createdAt;

	@UpdateTimestamp
	private LocalDateTime updatedAt;
}
