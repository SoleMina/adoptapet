package com.adoptapet.userservice.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.adoptapet.userservice.model.User;

import lombok.Data;

/** What the API returns for a user. The password never leaves the service. */
@Data
public class UserResponse {

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
	private LocalDateTime createdAt;

	public static UserResponse from(User user) {
		UserResponse response = new UserResponse();
		response.setId(user.getId());
		response.setUsername(user.getUsername());
		response.setEmail(user.getEmail());
		response.setRole(user.getRole().name());
		response.setActive(user.getActive());
		response.setFirstName(user.getFirstName());
		response.setLastName(user.getLastName());
		response.setDni(user.getDni());
		response.setBirthDate(user.getBirthDate());
		response.setPhone(user.getPhone());
		response.setAddress(user.getAddress());
		response.setCreatedAt(user.getCreatedAt());
		return response;
	}
}
