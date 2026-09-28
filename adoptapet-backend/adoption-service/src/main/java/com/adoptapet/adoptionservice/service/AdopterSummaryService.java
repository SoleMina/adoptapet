package com.adoptapet.adoptionservice.service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.adoptapet.adoptionservice.client.UserClient;
import com.adoptapet.adoptionservice.client.UserInfo;
import com.adoptapet.adoptionservice.dto.AdopterSummaryResponse;
import com.adoptapet.adoptionservice.model.AdoptionApplication;
import com.adoptapet.adoptionservice.model.ApplicationStatus;
import com.adoptapet.adoptionservice.repository.ApplicationRepository;
import com.adoptapet.shared.exception.ApiException;

import lombok.RequiredArgsConstructor;

/** Replaces AdoptanteService: adopter data from user-service joined with their applications. */
@Service
@RequiredArgsConstructor
public class AdopterSummaryService {

	private final UserClient userClient;
	private final ApplicationRepository applicationRepository;

	@Transactional(readOnly = true)
	public List<AdopterSummaryResponse> findAll() {
		Map<Long, List<AdoptionApplication>> byAdopter = applicationRepository.findAllByOrderByIdDesc().stream()
				.collect(Collectors.groupingBy(AdoptionApplication::getAdopterId));

		return userClient.getAdopters().stream()
				.map(adopter -> build(adopter, byAdopter.getOrDefault(adopter.getId(), List.of()), false))
				.toList();
	}

	@Transactional(readOnly = true)
	public AdopterSummaryResponse findById(Long adopterId) {
		UserInfo adopter = userClient.getUser(adopterId);
		if (!"ADOPTER".equals(adopter.getRole())) {
			throw ApiException.notFound("Adopter not found");
		}
		return build(adopter, applicationRepository.findByAdopterIdOrderByIdDesc(adopterId), true);
	}

	private AdopterSummaryResponse build(UserInfo adopter, List<AdoptionApplication> applications, boolean withHistory) {
		AdopterSummaryResponse summary = new AdopterSummaryResponse();
		summary.setId(adopter.getId());
		summary.setUsername(adopter.getUsername());
		summary.setFirstName(adopter.getFirstName());
		summary.setLastName(adopter.getLastName());
		summary.setDni(adopter.getDni());
		summary.setBirthDate(adopter.getBirthDate());
		summary.setEmail(adopter.getEmail());
		summary.setPhone(adopter.getPhone());
		summary.setAddress(adopter.getAddress());
		summary.setActive(adopter.getActive());

		summary.setTotalApplications(applications.size());
		summary.setPending(count(applications, ApplicationStatus.PENDING));
		summary.setApproved(count(applications, ApplicationStatus.APPROVED));
		summary.setNoShow(count(applications, ApplicationStatus.NO_SHOW));
		summary.setCompleted(count(applications, ApplicationStatus.COMPLETED));
		summary.setRejected(count(applications, ApplicationStatus.REJECTED));
		summary.setCancelled(count(applications, ApplicationStatus.CANCELLED));
		summary.setLastApplicationAt(applications.stream()
				.map(AdoptionApplication::getCreatedAt)
				.filter(Objects::nonNull)
				.max(Comparable::compareTo)
				.orElse(null));

		if (withHistory) {
			summary.setApplications(applications.stream().map(application -> {
				AdopterSummaryResponse.HistoryItem item = new AdopterSummaryResponse.HistoryItem();
				item.setId(application.getId());
				item.setCreatedAt(application.getCreatedAt());
				item.setStatus(application.getStatus().name());
				item.setPetName(application.getPetName());
				item.setPetSpecies(application.getPetSpecies());
				return item;
			}).toList());
		}
		return summary;
	}

	private long count(List<AdoptionApplication> applications, ApplicationStatus status) {
		return applications.stream().filter(a -> a.getStatus() == status).count();
	}
}
