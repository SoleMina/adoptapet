package com.adoptapet.adoptionservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Adoption form, sent as multipart/form-data together with the "dniFile" and "addressProofFile" files.
 * The adopter is taken from the token, never from the form.
 */
@Data
public class ApplicationRequest {

	@NotNull
	private Long petId;

	@NotBlank
	@Size(max = 1000)
	private String adoptionReason;

	@NotBlank
	@Size(max = 100)
	private String housingType;

	@NotBlank
	@Size(max = 1000)
	private String petExperience;

	@Size(max = 500)
	private String otherPets;

	@NotNull
	@Min(1)
	@Max(30)
	private Integer householdSize;

	@Size(max = 1000)
	private String comments;
}
