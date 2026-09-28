package com.adoptapet.adoptionservice.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.adoptapet.adoptionservice.dto.SlotAvailabilityResponse;
import com.adoptapet.adoptionservice.service.DeliverySlotService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/delivery-slots")
@RequiredArgsConstructor
public class DeliverySlotController {

	private final DeliverySlotService service;

	/** ?date=2026-10-05 */
	@GetMapping
	public ResponseEntity<List<SlotAvailabilityResponse>> availability(@RequestParam LocalDate date) {
		return ResponseEntity.ok(service.availability(date));
	}
}
