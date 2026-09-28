package com.adoptapet.petservice.controller;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.adoptapet.petservice.dto.PetRequest;
import com.adoptapet.petservice.dto.PetResponse;
import com.adoptapet.petservice.model.AdoptionStatus;
import com.adoptapet.petservice.service.ImageStorageService;
import com.adoptapet.petservice.service.PetService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {

	private final PetService service;
	private final ImageStorageService imageStorage;

	/** Public. Optional filters: ?status=AVAILABLE&species=Dog */
	@GetMapping
	public ResponseEntity<List<PetResponse>> findAll(@RequestParam(required = false) AdoptionStatus status,
			@RequestParam(required = false) String species) {
		return ResponseEntity.ok(service.findAll(status, species));
	}

	@GetMapping("/{id}")
	public ResponseEntity<PetResponse> findById(@PathVariable Long id) {
		return ResponseEntity.ok(service.findById(id));
	}

	@GetMapping("/images/{fileName}")
	public ResponseEntity<Resource> image(@PathVariable String fileName) {
		Resource image = imageStorage.load(fileName);
		MediaType type = MediaTypeFactory.getMediaType(image).orElse(MediaType.APPLICATION_OCTET_STREAM);
		return ResponseEntity.ok().contentType(type).body(image);
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<PetResponse> create(@Valid @ModelAttribute PetRequest request,
			@RequestPart(value = "image", required = false) MultipartFile image) {
		return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, image));
	}

	@PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<PetResponse> update(@PathVariable Long id, @Valid @ModelAttribute PetRequest request,
			@RequestPart(value = "image", required = false) MultipartFile image) {
		return ResponseEntity.ok(service.update(id, request, image));
	}

	/** Logical delete: the pet becomes INACTIVE. */
	@DeleteMapping("/{id}")
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<PetResponse> deactivate(@PathVariable Long id, @RequestParam Long version) {
		return ResponseEntity.ok(service.deactivate(id, version));
	}

	@PutMapping("/{id}/activate")
	@PreAuthorize("hasAnyRole('ADMIN','WORKER')")
	public ResponseEntity<PetResponse> activate(@PathVariable Long id) {
		return ResponseEntity.ok(service.activate(id));
	}
}
