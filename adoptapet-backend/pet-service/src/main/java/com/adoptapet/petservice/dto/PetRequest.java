package com.adoptapet.petservice.dto;

import com.adoptapet.petservice.model.HealthStatus;
import com.adoptapet.petservice.model.Sex;
import com.adoptapet.petservice.model.SterilizationStatus;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Sent as multipart/form-data (fields + optional "image" file) so the pet and its photo
 * are saved in one request.
 */
@Data
public class PetRequest {

	@NotBlank
	@Size(max = 50)
	private String name;

	@NotBlank
	@Size(max = 30)
	private String species;

	@NotBlank
	@Size(max = 50)
	private String breed;

	@NotNull
	private Sex sex;

	@NotNull
	@Min(0)
	@Max(30)
	private Integer ageYears;

	@NotNull
	@Min(0)
	@Max(11)
	private Integer ageMonths;

	@NotNull
	private HealthStatus healthStatus;

	@NotNull
	private SterilizationStatus sterilizationStatus;

	@Size(max = 500)
	private String observations;

	/** Required on update: the version the client last read. */
	private Long version;
}
