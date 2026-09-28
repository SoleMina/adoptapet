package com.adoptapet.adoptionservice.dto;

import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Replaces HorarioDisponibilidad. */
@Data
@AllArgsConstructor
public class SlotAvailabilityResponse {

	private String label;
	private LocalTime startTime;
	private LocalTime endTime;
	private Integer capacity;
	private Integer reserved;
	private Integer free;
	/** true when it still has room and has not started yet. */
	private Boolean available;
	private Boolean expired;
}
