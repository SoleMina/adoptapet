package com.adoptapet.notificationservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.adoptapet.notificationservice.model.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

	List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

	List<Notification> findByRecipientIdAndReadAtIsNull(Long recipientId);

	long countByRecipientIdAndReadAtIsNull(Long recipientId);

	boolean existsByEventIdAndRecipientId(String eventId, Long recipientId);
}
