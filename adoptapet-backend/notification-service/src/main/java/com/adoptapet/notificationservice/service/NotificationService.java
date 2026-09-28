package com.adoptapet.notificationservice.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.adoptapet.shared.event.AdoptionEvent;
import com.adoptapet.shared.event.EventTypes;
import com.adoptapet.shared.exception.ApiException;
import com.adoptapet.notificationservice.dto.NotificationResponse;
import com.adoptapet.notificationservice.model.Notification;
import com.adoptapet.notificationservice.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

	private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

	private final NotificationRepository repository;

	/** Turns an adoption event into a message for the adopter. Duplicated events are ignored. */
	@Transactional
	public void handle(AdoptionEvent event) {
		if (repository.existsByEventIdAndRecipientId(event.getEventId(), event.getAdopterId())) {
			log.info("Event {} already processed", event.getEventId());
			return;
		}

		String pet = event.getPetName();
		String[] text = switch (event.getType()) {
			case EventTypes.CREATED -> new String[] { "Application received",
					"We received your application to adopt " + pet + ". Our team will review it soon." };
			case EventTypes.APPROVED -> new String[] { "Application approved",
					"Your application to adopt " + pet + " was approved. Delivery: " + delivery(event) + "." };
			case EventTypes.REJECTED -> new String[] { "Application rejected",
					"Your application to adopt " + pet + " was rejected. Reason: " + event.getReason() };
			case EventTypes.RESCHEDULED -> new String[] { "Delivery rescheduled",
					"The delivery of " + pet + " was rescheduled to " + delivery(event) + "." };
			case EventTypes.NO_SHOW -> new String[] { "Missed delivery",
					"You did not attend the delivery of " + pet + ". Please contact us to reschedule." };
			case EventTypes.CANCELLED -> new String[] { "Adoption cancelled",
					"The adoption of " + pet + " was cancelled. Reason: " + event.getReason() };
			case EventTypes.COMPLETED -> new String[] { "Adoption completed",
					"Congratulations! The adoption of " + pet + " is complete. Thank you for adopting." };
			default -> null;
		};
		if (text == null) {
			return;
		}

		Notification notification = new Notification();
		notification.setEventId(event.getEventId());
		notification.setRecipientId(event.getAdopterId());
		notification.setApplicationId(event.getApplicationId());
		notification.setType(event.getType());
		notification.setTitle(text[0]);
		notification.setMessage(text[1]);
		repository.save(notification);
	}

	@Transactional(readOnly = true)
	public List<NotificationResponse> findMine(Long userId) {
		return repository.findByRecipientIdOrderByCreatedAtDesc(userId).stream().map(NotificationResponse::from).toList();
	}

	@Transactional(readOnly = true)
	public long countUnread(Long userId) {
		return repository.countByRecipientIdAndReadAtIsNull(userId);
	}

	@Transactional
	public NotificationResponse markAsRead(Long id, Long userId) {
		Notification notification = repository.findById(id)
				.filter(n -> n.getRecipientId().equals(userId))
				.orElseThrow(() -> ApiException.notFound("Notification not found"));
		if (notification.getReadAt() == null) {
			notification.setReadAt(LocalDateTime.now());
		}
		return NotificationResponse.from(repository.save(notification));
	}

	@Transactional
	public void markAllAsRead(Long userId) {
		LocalDateTime now = LocalDateTime.now();
		List<Notification> unread = repository.findByRecipientIdAndReadAtIsNull(userId);
		unread.forEach(n -> n.setReadAt(now));
		repository.saveAll(unread);
	}

	private String delivery(AdoptionEvent event) {
		if (event.getDeliveryDate() == null) {
			return "to be confirmed";
		}
		return event.getDeliveryDate().format(DATE) + " from " + event.getStartTime() + " to " + event.getEndTime();
	}
}
