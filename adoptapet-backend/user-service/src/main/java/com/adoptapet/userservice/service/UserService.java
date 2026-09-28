package com.adoptapet.userservice.service;

import java.util.List;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.adoptapet.common.exception.ApiException;
import com.adoptapet.userservice.dto.RegisterRequest;
import com.adoptapet.userservice.dto.UpdateUserRequest;
import com.adoptapet.userservice.dto.UserResponse;
import com.adoptapet.userservice.model.Role;
import com.adoptapet.userservice.model.User;
import com.adoptapet.userservice.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

	private final UserRepository repository;
	private final PasswordEncoder passwordEncoder;

	@Transactional
	public UserResponse create(RegisterRequest request, Role role) {
		String username = request.getUsername().toLowerCase(Locale.ROOT);
		String email = request.getEmail().toLowerCase(Locale.ROOT);

		if (repository.existsByUsername(username)) {
			throw ApiException.conflict("Username is already registered");
		}
		if (repository.existsByEmail(email)) {
			throw ApiException.conflict("Email is already registered");
		}
		if (repository.existsByDni(request.getDni())) {
			throw ApiException.conflict("DNI is already registered");
		}

		User user = new User();
		user.setUsername(username);
		user.setEmail(email);
		user.setPassword(passwordEncoder.encode(request.getPassword()));
		user.setRole(role);
		user.setActive(true);
		user.setFirstName(request.getFirstName());
		user.setLastName(request.getLastName());
		user.setDni(request.getDni());
		user.setBirthDate(request.getBirthDate());
		user.setPhone(request.getPhone());
		user.setAddress(request.getAddress());

		return UserResponse.from(repository.save(user));
	}

	@Transactional(readOnly = true)
	public List<UserResponse> findAll(Role role) {
		List<User> users = role == null ? repository.findAll() : repository.findByRoleOrderByIdAsc(role);
		return users.stream().map(UserResponse::from).toList();
	}

	@Transactional(readOnly = true)
	public UserResponse findById(Long id) {
		return UserResponse.from(getUser(id));
	}

	@Transactional
	public UserResponse update(Long id, UpdateUserRequest request) {
		User user = getUser(id);
		String email = request.getEmail().toLowerCase(Locale.ROOT);

		if (repository.existsByEmailAndIdNot(email, id)) {
			throw ApiException.conflict("Email is already registered");
		}
		if (repository.existsByDniAndIdNot(request.getDni(), id)) {
			throw ApiException.conflict("DNI is already registered");
		}

		user.setEmail(email);
		user.setFirstName(request.getFirstName());
		user.setLastName(request.getLastName());
		user.setDni(request.getDni());
		user.setBirthDate(request.getBirthDate());
		user.setPhone(request.getPhone());
		user.setAddress(request.getAddress());

		return UserResponse.from(repository.save(user));
	}

	@Transactional
	public UserResponse setActive(Long id, boolean active, Long currentUserId) {
		User user = getUser(id);

		if (user.getId().equals(currentUserId)) {
			throw ApiException.conflict("You cannot change the status of your own account");
		}
		if (user.getRole() == Role.ADMIN) {
			throw ApiException.conflict("Administrator accounts cannot be deactivated");
		}

		user.setActive(active);
		return UserResponse.from(repository.save(user));
	}

	private User getUser(Long id) {
		return repository.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
	}
}
