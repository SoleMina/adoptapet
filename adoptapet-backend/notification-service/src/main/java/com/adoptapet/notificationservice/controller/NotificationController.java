package com.adoptapet.notificationservice.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.adoptapet.common.security.AuthUser;
import com.adoptapet.notificationservice.dto.NotificationResponse;
import com.adoptapet.notificationservice.service.NotificationService;

import lombok.RequiredArgsConstructor;

/** Each user only sees their own notifications (the id always comes from the token). */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

	private final NotificationService service;

	@GetMapping("/me")
	public ResponseEntity<List<NotificationResponse>> mine(@AuthenticationPrincipal AuthUser user) {
		return ResponseEntity.ok(service.findMine(user.getId()));
	}

	@GetMapping("/me/unread-count")
	public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal AuthUser user) {
		return ResponseEntity.ok(Map.of("unread", service.countUnread(user.getId())));
	}

	@PutMapping("/{id}/read")
	public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
		return ResponseEntity.ok(service.markAsRead(id, user.getId()));
	}

	@PutMapping("/me/read-all")
	public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal AuthUser user) {
		service.markAllAsRead(user.getId());
		return ResponseEntity.noContent().build();
	}
}
