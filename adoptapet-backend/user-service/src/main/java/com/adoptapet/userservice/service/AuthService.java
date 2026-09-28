package com.adoptapet.userservice.service;

import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.adoptapet.common.exception.ApiException;
import com.adoptapet.common.security.JwtService;
import com.adoptapet.userservice.dto.AuthResponse;
import com.adoptapet.userservice.dto.LoginRequest;
import com.adoptapet.userservice.dto.RegisterRequest;
import com.adoptapet.userservice.dto.UserResponse;
import com.adoptapet.userservice.model.Role;
import com.adoptapet.userservice.model.User;
import com.adoptapet.userservice.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final UserRepository repository;
	private final UserService userService;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	/** Public registration always creates an ADOPTER, whatever the client sends. */
	public UserResponse register(RegisterRequest request) {
		return userService.create(request, Role.ADOPTER);
	}

	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest request) {
		User user = repository.findByUsername(request.getUsername().toLowerCase(Locale.ROOT))
				.orElseThrow(() -> ApiException.unauthorized("Invalid credentials"));

		if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
			throw ApiException.unauthorized("Invalid credentials");
		}
		if (!Boolean.TRUE.equals(user.getActive())) {
			throw ApiException.forbidden("Your account is disabled");
		}

		String token = jwtService.generateToken(user.getId(), user.getUsername(), user.getRole().name());
		return new AuthResponse(token, "Bearer", jwtService.getExpiration() / 1000, UserResponse.from(user));
	}
}
