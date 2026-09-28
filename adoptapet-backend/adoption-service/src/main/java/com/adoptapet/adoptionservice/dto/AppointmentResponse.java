package com.adoptapet.adoptionservice.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.adoptapet.adoptionservice.model.DeliveryAppointment;

import lombok.Data;

@Data
public class AppointmentResponse {

	private LocalDate deliveryDate;
	private LocalTime startTime;
	private LocalTime endTime;
	private LocalDateTime pickupDeadline;
	private String status;
	private String observation;
	private String cancellationReason;

	public static AppointmentResponse from(DeliveryAppointment appointment) {
		if (appointment == null) {
			return null;
		}
		AppointmentResponse response = new AppointmentResponse();
		response.setDeliveryDate(appointment.getDeliveryDate());
		response.setStartTime(appointment.getStartTime());
		response.setEndTime(appointment.getEndTime());
		response.setPickupDeadline(appointment.getPickupDeadline());
		response.setStatus(appointment.getStatus().name());
		response.setObservation(appointment.getObservation());
		response.setCancellationReason(appointment.getCancellationReason());
		return response;
	}
}
