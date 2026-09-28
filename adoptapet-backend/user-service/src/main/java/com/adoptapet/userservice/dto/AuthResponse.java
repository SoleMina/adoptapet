package com.adoptapet.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {

	private String token;
	private String tokenType;
	private Long expiresIn;
	private UserResponse user;
}
