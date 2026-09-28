package com.adoptapet.adoptionservice.client;

import lombok.Data;

/** The fields adoption-service reads from pet-service. */
@Data
public class PetInfo {

	private Long id;
	private String name;
	private String species;
	private String breed;
	private String sex;
	private Integer ageYears;
	private Integer ageMonths;
	private String healthStatus;
	private String adoptionStatus;

	public boolean isHealthy() {
		return "HEALTHY".equals(healthStatus);
	}

	public boolean isAvailable() {
		return "AVAILABLE".equals(adoptionStatus);
	}
}
