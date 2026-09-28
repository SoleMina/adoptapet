package com.adoptapet.adoptionservice.client;

import java.time.LocalDate;

import lombok.Data;

/** The fields adoption-service reads from user-service. */
@Data
public class UserInfo {

	private Long id;
	private String username;
	private String email;
	private String role;
	private Boolean active;
	private String firstName;
	private String lastName;
	private String dni;
	private LocalDate birthDate;
	private String phone;
	private String address;

	public String getFullName() {
		return ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
	}
}
