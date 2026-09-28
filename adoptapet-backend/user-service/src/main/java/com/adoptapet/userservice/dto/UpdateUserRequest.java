package com.adoptapet.userservice.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Profile data that can be edited. Username, role and password are not changed here. */
@Data
public class UpdateUserRequest {

	@NotBlank
	@Email
	@Size(max = 150)
	private String email;

	@NotBlank
	@Size(max = 100)
	private String firstName;

	@NotBlank
	@Size(max = 100)
	private String lastName;

	@NotBlank
	@Pattern(regexp = "[0-9]{8}", message = "must have 8 digits")
	private String dni;

	@NotNull
	@Past
	private LocalDate birthDate;

	@NotBlank
	@Pattern(regexp = "[0-9]{9}", message = "must have 9 digits")
	private String phone;

	@Size(max = 250)
	private String address;
}
