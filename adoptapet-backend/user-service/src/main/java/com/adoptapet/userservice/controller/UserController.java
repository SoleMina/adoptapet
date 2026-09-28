package com.adoptapet.userservice.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.adoptapet.common.exception.ApiException;
import com.adoptapet.common.security.AuthUser;
import com.adoptapet.userservice.dto.RegisterRequest;
import com.adoptapet.userservice.dto.UpdateUserRequest;
import com.adoptapet.userservice.dto.UserResponse;
import com.adoptapet.userservice.model.Role;
import com.adoptapet.userservice.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService service;

	@GetMapping("/me")
	public ResponseEntity<UserResponse> me(@AuthenticationPrincipal AuthUser user) {
		return ResponseEntity.ok(service.findById(user.getId()));
	}

	@PutMapping("/me")
	public ResponseEntity<UserResponse> updateMe(@AuthenticationPrincipal AuthUser user,
			@Valid @RequestBody UpdateUserRequest request) {
		return ResponseEntity.ok(service.update(user.getId(), request));
	}

	/** Optional filter: ?role=ADOPTER | WORKER | ADMIN */
	@GetMapping
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<List<UserResponse>> findAll(@RequestParam(required = false) Role role) {
		return ResponseEntity.ok(service.findAll(role));
	}

	@GetMapping("/{id}")
	public ResponseEntity<UserResponse> findById(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
		if (!user.isStaff() && !user.getId().equals(id)) {
			throw ApiException.forbidden("You can only view your own profile");
		}
		return ResponseEntity.ok(service.findById(id));
	}

	@PostMapping("/workers")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<UserResponse> createWorker(@Valid @RequestBody RegisterRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, Role.WORKER));
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<UserResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
		return ResponseEntity.ok(service.update(id, request));
	}

	@PutMapping("/{id}/activate")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<UserResponse> activate(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
		return ResponseEntity.ok(service.setActive(id, true, user.getId()));
	}

	@PutMapping("/{id}/deactivate")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<UserResponse> deactivate(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
		return ResponseEntity.ok(service.setActive(id, false, user.getId()));
	}
}
