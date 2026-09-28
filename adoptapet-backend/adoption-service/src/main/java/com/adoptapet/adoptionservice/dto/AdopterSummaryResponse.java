package com.adoptapet.adoptionservice.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

/** Replaces AdoptanteResumen: adopter data (user-service) + application counters (this service). */
@Data
public class AdopterSummaryResponse {

	private Long id;
	private String username;
	private String firstName;
	private String lastName;
	private String dni;
	private LocalDate birthDate;
	private String email;
	private String phone;
	private String address;
	private Boolean active;

	private long totalApplications;
	private long pending;
	private long approved;
	private long noShow;
	private long completed;
	private long rejected;
	private long cancelled;
	private LocalDateTime lastApplicationAt;

	/** Only filled in the detail endpoint. */
	private List<HistoryItem> applications;

	@Data
	public static class HistoryItem {
		private Long id;
		private LocalDateTime createdAt;
		private String status;
		private String petName;
		private String petSpecies;
	}
}
