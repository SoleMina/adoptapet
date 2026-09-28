package com.adoptapet.adoptionservice.controller;

import java.time.Clock;
import java.time.LocalDate;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.adoptapet.adoptionservice.model.ApplicationStatus;
import com.adoptapet.adoptionservice.service.ReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

	private final ReportService service;
	private final Clock clock;

	/** Optional filters: ?applicationStatus=COMPLETED&petStatus=AVAILABLE&species=Dog */
	@GetMapping("/general")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<byte[]> general(@RequestParam(required = false) ApplicationStatus applicationStatus,
			@RequestParam(required = false) String petStatus, @RequestParam(required = false) String species) {
		String fileName = "adoptions_report_" + LocalDate.now(clock) + ".pdf";
		return ResponseEntity.ok()
				.contentType(MediaType.APPLICATION_PDF)
				.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileName).build().toString())
				.body(service.generalReport(applicationStatus, petStatus, species));
	}
}
