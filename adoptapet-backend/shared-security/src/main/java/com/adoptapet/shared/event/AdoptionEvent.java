package com.adoptapet.shared.event;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Message published by adoption-service to RabbitMQ every time an adoption application changes.
 * pet-service uses it to update the pet status; notification-service to notify the adopter.
 * Never put documents or personal data here.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdoptionEvent {

	private String eventId;
	private String type;
	private Long applicationId;
	private Long adopterId;
	private Long petId;
	private String petName;
	private String status;
	private String reason;
	private LocalDate deliveryDate;
	private LocalTime startTime;
	private LocalTime endTime;
	private LocalDateTime occurredAt;
}
