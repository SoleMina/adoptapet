package com.adoptapet.userservice.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Used by public adopter registration and by the admin when creating a worker. */
@Data
public class RegisterRequest {

	@NotBlank
	@Size(max = 50)
	@Pattern(regexp = "[a-zA-Z0-9._-]+", message = "only letters, numbers, dot, dash and underscore")
	private String username;

	@NotBlank
	@Email
	@Size(max = 150)
	private String email;

	@NotBlank
	@Size(min = 8, max = 72)
	private String password;

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
