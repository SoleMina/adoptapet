package com.adoptapet.adoptionservice.controller;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.adoptapet.adoptionservice.dto.ApplicationRequest;
import com.adoptapet.adoptionservice.dto.ApplicationResponse;
import com.adoptapet.adoptionservice.dto.ReasonRequest;
import com.adoptapet.adoptionservice.dto.ScheduleRequest;
import com.adoptapet.adoptionservice.model.ApplicationStatus;
import com.adoptapet.adoptionservice.model.DocumentType;
import com.adoptapet.adoptionservice.service.ApplicationService;
import com.adoptapet.common.security.AuthUser;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

	private final ApplicationService service;

	// ----- adopter

	/** multipart/form-data: form fields + "dniFile" + "addressProofFile". */
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasRole('ADOPTER')")
	public ResponseEntity<ApplicationResponse> register(@Valid @ModelAttribute ApplicationRequest request,
			@RequestPart("dniFile") MultipartFile dniFile,
			@RequestPart("addressProofFile") MultipartFile addressProofFile,
			@AuthenticationPrincipal AuthUser user) {
		return ResponseEntity.status(HttpStatus.CREATED).body(service.register(request, dniFile, addressProofFile, user));
	}

	@GetMapping("/me")
	public ResponseEntity<List<ApplicationResponse>> mine(@AuthenticationPrincipal AuthUser user) {
		return ResponseEntity.ok(service.findByAdopter(user.getId()));
	}

	// ----- read (staff, or the owner for a single application)

	/** Optional filter: ?status=PENDING */
	@GetMapping
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<List<ApplicationResponse>> findAll(@RequestParam(required = false) ApplicationStatus status) {
		return ResponseEntity.ok(service.findAll(status));
	}

	@GetMapping("/adopter/{adopterId}")
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<List<ApplicationResponse>> findByAdopter(@PathVariable Long adopterId) {
		return ResponseEntity.ok(service.findByAdopter(adopterId));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ApplicationResponse> findById(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
		return ResponseEntity.ok(service.findById(id, user));
	}

	/** type = DNI | ADDRESS_PROOF | ACT | SIGNED_ACT */
	@GetMapping("/{id}/documents/{type}")
	public ResponseEntity<Resource> document(@PathVariable Long id, @PathVariable DocumentType type,
			@AuthenticationPrincipal AuthUser user) {
		Resource file = service.getDocument(id, type, user);
		return ResponseEntity.ok()
				.contentType(MediaTypeFactory.getMediaType(file).orElse(MediaType.APPLICATION_OCTET_STREAM))
				.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(file.getFilename()).build().toString())
				.body(file);
	}

	// ----- workflow (staff)

	@PutMapping("/{id}/approve")
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<ApplicationResponse> approve(@PathVariable Long id, @Valid @RequestBody ScheduleRequest request,
			@AuthenticationPrincipal AuthUser user) {
		return ResponseEntity.ok(service.approve(id, request, user));
	}

	@PutMapping("/{id}/reject")
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<ApplicationResponse> reject(@PathVariable Long id, @Valid @RequestBody ReasonRequest request) {
		return ResponseEntity.ok(service.reject(id, request.getReason()));
	}

	@PutMapping("/{id}/no-show")
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<ApplicationResponse> noShow(@PathVariable Long id) {
		return ResponseEntity.ok(service.markNoShow(id));
	}

	@PutMapping("/{id}/reschedule")
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<ApplicationResponse> reschedule(@PathVariable Long id, @Valid @RequestBody ScheduleRequest request,
			@AuthenticationPrincipal AuthUser user) {
		return ResponseEntity.ok(service.reschedule(id, request, user));
	}

	@PutMapping("/{id}/cancel")
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<ApplicationResponse> cancel(@PathVariable Long id, @Valid @RequestBody ReasonRequest request) {
		return ResponseEntity.ok(service.cancel(id, request.getReason()));
	}

	/** Generates the adoption act and returns the PDF. */
	@PostMapping("/{id}/act")
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<byte[]> generateAct(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
		return ResponseEntity.ok()
				.contentType(MediaType.APPLICATION_PDF)
				.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename("act_" + id + ".pdf").build().toString())
				.body(service.generateAct(id, user));
	}

	/** multipart/form-data with a "file" part. */
	@PostMapping(value = "/{id}/signed-act", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<ApplicationResponse> uploadSignedAct(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
		return ResponseEntity.ok(service.uploadSignedAct(id, file));
	}

	@PutMapping("/{id}/complete")
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<ApplicationResponse> complete(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
		return ResponseEntity.ok(service.complete(id, user));
	}

	@PutMapping("/{id}/complete-contingency")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApplicationResponse> completeByContingency(@PathVariable Long id,
			@Valid @RequestBody ReasonRequest request, @AuthenticationPrincipal AuthUser user) {
		return ResponseEntity.ok(service.completeByContingency(id, request.getReason(), user));
	}
}
