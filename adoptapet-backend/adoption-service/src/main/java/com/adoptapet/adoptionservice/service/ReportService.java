package com.adoptapet.adoptionservice.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.adoptapet.adoptionservice.client.PetClient;
import com.adoptapet.adoptionservice.client.PetInfo;
import com.adoptapet.adoptionservice.client.UserClient;
import com.adoptapet.adoptionservice.client.UserInfo;
import com.adoptapet.adoptionservice.model.AdoptionApplication;
import com.adoptapet.adoptionservice.model.ApplicationStatus;
import com.adoptapet.adoptionservice.pdf.ReportPdfGenerator;
import com.adoptapet.adoptionservice.repository.ApplicationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportService {

	private final ApplicationRepository applicationRepository;
	private final PetClient petClient;
	private final UserClient userClient;
	private final ReportPdfGenerator reportPdfGenerator;

	/** All filters are optional. */
	@Transactional(readOnly = true)
	public byte[] generalReport(ApplicationStatus applicationStatus, String petStatus, String species) {
		List<PetInfo> pets = petStatus == null || petStatus.isBlank()
				? allPets()
				: petClient.getPets(petStatus.trim().toUpperCase());
		if (species != null && !species.isBlank()) {
			pets = pets.stream().filter(p -> species.trim().equalsIgnoreCase(p.getSpecies())).toList();
		}

		List<AdoptionApplication> applications = applicationStatus == null
				? applicationRepository.findAllByOrderByIdDesc()
				: applicationRepository.findByStatusOrderByIdDesc(applicationStatus);

		Map<Long, String> adopterNames = userClient.getAdopters().stream()
				.collect(Collectors.toMap(UserInfo::getId, UserInfo::getFullName));

		try {
			return reportPdfGenerator.generate(pets, applications, adopterNames);
		} catch (IOException e) {
			throw new IllegalStateException("Could not generate the report", e);
		}
	}

	/** pet-service hides inactive pets unless they are asked for explicitly. */
	private List<PetInfo> allPets() {
		List<PetInfo> pets = new ArrayList<>(petClient.getPets(null));
		pets.addAll(petClient.getPets("INACTIVE"));
		return pets.stream()
				.collect(Collectors.toMap(PetInfo::getId, Function.identity(), (a, b) -> a))
				.values().stream().toList();
	}
}
