package com.adoptapet.shared.security;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Authenticated user taken from the JWT. Available in controllers through
 * {@code @AuthenticationPrincipal AuthUser user}.
 */
@Data
@AllArgsConstructor
public class AuthUser {

	private Long id;
	private String username;
	private String role;

	public boolean isAdmin() {
		return "ADMIN".equals(role);
	}

	public boolean isStaff() {
		return "ADMIN".equals(role) || "WORKER".equals(role);
	}
}
