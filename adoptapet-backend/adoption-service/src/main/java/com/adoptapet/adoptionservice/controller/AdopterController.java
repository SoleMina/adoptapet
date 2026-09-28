package com.adoptapet.adoptionservice.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.adoptapet.adoptionservice.dto.AdopterSummaryResponse;
import com.adoptapet.adoptionservice.service.AdopterSummaryService;

import lombok.RequiredArgsConstructor;

/** Adopters with their application counters. Activate/deactivate lives in user-service. */
@RestController
@RequestMapping("/api/adopters")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
public class AdopterController {

	private final AdopterSummaryService service;

	@GetMapping
	public ResponseEntity<List<AdopterSummaryResponse>> findAll() {
		return ResponseEntity.ok(service.findAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<AdopterSummaryResponse> findById(@PathVariable Long id) {
		return ResponseEntity.ok(service.findById(id));
	}
}
