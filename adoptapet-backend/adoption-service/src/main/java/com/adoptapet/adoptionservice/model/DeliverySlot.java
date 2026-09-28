package com.adoptapet.adoptionservice.model;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

/** Replaces CupoEntrega: how many deliveries are booked in one time window of one day. */
@Entity
@Table(name = "delivery_slots", uniqueConstraints = @UniqueConstraint(name = "uk_delivery_slot",
		columnNames = { "delivery_date", "start_time", "end_time" }))
@Data
public class DeliverySlot {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "delivery_date", nullable = false)
	private LocalDate deliveryDate;

	@Column(name = "start_time", nullable = false)
	private LocalTime startTime;

	@Column(name = "end_time", nullable = false)
	private LocalTime endTime;

	@Column(nullable = false)
	private Integer capacity;

	@Column(nullable = false)
	private Integer reserved = 0;
}
