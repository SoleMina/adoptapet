package com.adoptapet.adoptionservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Reason required to reject, cancel or close an application by contingency. */
@Data
public class ReasonRequest {

	@NotBlank
	@Size(max = 500)
	private String reason;
}
