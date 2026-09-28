package com.adoptapet.notificationservice.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

/**
 * One notification per event and recipient. The unique key makes a redelivered RabbitMQ message harmless.
 */
@Entity
@Table(name = "notifications",
		uniqueConstraints = @UniqueConstraint(name = "uk_notification_event_recipient", columnNames = { "event_id", "recipient_id" }),
		indexes = @Index(name = "ix_notification_inbox", columnList = "recipient_id, created_at"))
@Data
public class Notification {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "event_id", nullable = false, length = 36)
	private String eventId;

	@Column(name = "recipient_id", nullable = false)
	private Long recipientId;

	@Column(nullable = false)
	private Long applicationId;

	@Column(nullable = false, length = 30)
	private String type;

	@Column(nullable = false, length = 150)
	private String title;

	@Column(nullable = false, length = 1000)
	private String message;

	private LocalDateTime readAt;

	@CreationTimestamp
	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;
}
