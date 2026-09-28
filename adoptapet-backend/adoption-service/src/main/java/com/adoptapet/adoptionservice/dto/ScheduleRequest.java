package com.adoptapet.adoptionservice.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Delivery appointment used to approve or reschedule an application. Times are Peru time. */
@Data
public class ScheduleRequest {

	@NotNull
	private LocalDate deliveryDate;

	/** 10:00, 14:00 or 16:00 */
	@NotNull
	private LocalTime startTime;

	/** 12:00, 16:00 or 18:00 */
	@NotNull
	private LocalTime endTime;

	@NotNull
	private LocalDateTime pickupDeadline;

	@Size(max = 500)
	private String observation;
}
