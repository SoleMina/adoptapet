package com.adoptapet.notificationservice.dto;

import java.time.LocalDateTime;

import com.adoptapet.notificationservice.model.Notification;

import lombok.Data;

@Data
public class NotificationResponse {

	private Long id;
	private Long applicationId;
	private String type;
	private String title;
	private String message;
	private boolean read;
	private LocalDateTime createdAt;

	public static NotificationResponse from(Notification notification) {
		NotificationResponse response = new NotificationResponse();
		response.setId(notification.getId());
		response.setApplicationId(notification.getApplicationId());
		response.setType(notification.getType());
		response.setTitle(notification.getTitle());
		response.setMessage(notification.getMessage());
		response.setRead(notification.getReadAt() != null);
		response.setCreatedAt(notification.getCreatedAt());
		return response;
	}
}
