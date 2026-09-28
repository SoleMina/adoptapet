package com.adoptapet.petservice.dto;

import java.time.LocalDateTime;

import com.adoptapet.petservice.model.Pet;

import lombok.Data;

@Data
public class PetResponse {

	private Long id;
	private String name;
	private String species;
	private String breed;
	private String sex;
	private Integer ageYears;
	private Integer ageMonths;
	private String healthStatus;
	private String sterilizationStatus;
	private String adoptionStatus;
	private String observations;
	private String imageUrl;
	private Long version;
	private LocalDateTime createdAt;

	public static PetResponse from(Pet pet) {
		PetResponse response = new PetResponse();
		response.setId(pet.getId());
		response.setName(pet.getName());
		response.setSpecies(pet.getSpecies());
		response.setBreed(pet.getBreed());
		response.setSex(pet.getSex().name());
		response.setAgeYears(pet.getAgeYears());
		response.setAgeMonths(pet.getAgeMonths());
		response.setHealthStatus(pet.getHealthStatus().name());
		response.setSterilizationStatus(pet.getSterilizationStatus().name());
		response.setAdoptionStatus(pet.getAdoptionStatus().name());
		response.setObservations(pet.getObservations());
		response.setImageUrl(pet.getImageName() == null ? null : "/api/pets/images/" + pet.getImageName());
		response.setVersion(pet.getVersion());
		response.setCreatedAt(pet.getCreatedAt());
		return response;
	}
}
