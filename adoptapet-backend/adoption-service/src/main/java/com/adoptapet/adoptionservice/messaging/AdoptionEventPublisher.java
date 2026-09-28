package com.adoptapet.adoptionservice.messaging;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.adoptapet.adoptionservice.model.AdoptionApplication;
import com.adoptapet.adoptionservice.model.DeliveryAppointment;
import com.adoptapet.shared.event.AdoptionEvent;
import com.adoptapet.shared.event.EventTypes;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Events are sent to RabbitMQ only after the database transaction commits,
 * so other services never hear about a change that was rolled back.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdoptionEventPublisher {

	private final ApplicationEventPublisher springEvents;
	private final RabbitTemplate rabbitTemplate;
	private final Clock clock;

	public void publish(String type, AdoptionApplication application, DeliveryAppointment appointment, String reason) {
		AdoptionEvent event = AdoptionEvent.builder()
				.eventId(UUID.randomUUID().toString())
				.type(type)
				.applicationId(application.getId())
				.adopterId(application.getAdopterId())
				.petId(application.getPetId())
				.petName(application.getPetName())
				.status(application.getStatus().name())
				.reason(reason)
				.deliveryDate(appointment == null ? null : appointment.getDeliveryDate())
				.startTime(appointment == null ? null : appointment.getStartTime())
				.endTime(appointment == null ? null : appointment.getEndTime())
				.occurredAt(LocalDateTime.now(clock))
				.build();

		springEvents.publishEvent(event);
	}

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void sendAfterCommit(AdoptionEvent event) {
		try {
			rabbitTemplate.convertAndSend(EventTypes.EXCHANGE, EventTypes.routingKey(event.getType()), event);
			log.info("Published {} for application {}", event.getType(), event.getApplicationId());
		} catch (AmqpException e) {
			log.error("Could not publish {} for application {}", event.getType(), event.getApplicationId(), e);
		}
	}
}
