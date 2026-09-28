package com.adoptapet.adoptionservice.pdf;

import java.io.IOException;
import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.adoptapet.adoptionservice.client.PetInfo;
import com.adoptapet.adoptionservice.model.AdoptionApplication;
import com.adoptapet.adoptionservice.model.ApplicationStatus;

import lombok.RequiredArgsConstructor;

/** General administrative report: pets and applications with totals and a detail table. */
@Component
@RequiredArgsConstructor
public class ReportPdfGenerator {

	private static final String[] COLUMNS = { "Adopter", "Pet", "Status", "Housing", "People", "Date" };
	private static final float[] COLUMN_X = { 0, 140, 235, 320, 410, 455 };
	private static final int[] MAX_CHARS = { 28, 18, 14, 16, 6, 12 };

	private final Clock clock;

	public byte[] generate(List<PetInfo> pets, List<AdoptionApplication> applications, Map<Long, String> adopterNames)
			throws IOException {

		long completed = count(applications, ApplicationStatus.COMPLETED);

		try (PdfWriter pdf = new PdfWriter("Administrative report")) {
			pdf.header("ADOPTIONS REPORT", "Generated on " + LocalDate.now(clock));

			pdf.metrics(new String[] { "Pets", "Available", "Applications", "Completed" },
					new long[] { pets.size(), pets.stream().filter(PetInfo::isAvailable).count(), applications.size(), completed });

			pdf.section("Key indicators");
			for (ApplicationStatus status : ApplicationStatus.values()) {
				pdf.field(status.name(), count(applications, status));
			}
			pdf.field("Completion rate", percent(completed, applications.size()) + "%");
			pdf.space(8);

			pdf.section("Pets by status");
			groupAndPrint(pdf, pets, PetInfo::getAdoptionStatus);

			pdf.section("Pets by species");
			groupAndPrint(pdf, pets, PetInfo::getSpecies);

			pdf.section("Applications detail");
			pdf.tableHeader(COLUMNS, COLUMN_X);
			for (AdoptionApplication application : applications) {
				pdf.tableRow(new String[] {
						adopterNames.getOrDefault(application.getAdopterId(), "#" + application.getAdopterId()),
						application.getPetName(),
						application.getStatus().name(),
						application.getHousingType(),
						String.valueOf(application.getHouseholdSize()),
						application.getCreatedAt() == null ? "" : application.getCreatedAt().toLocalDate().toString()
				}, COLUMN_X, MAX_CHARS);
			}
			return pdf.toBytes();
		}
	}

	private <T> void groupAndPrint(PdfWriter pdf, List<T> items, Function<T, String> key) throws IOException {
		Map<String, Long> groups = items.stream()
				.collect(Collectors.groupingBy(item -> key.apply(item) == null ? "-" : key.apply(item),
						LinkedHashMap::new, Collectors.counting()));
		for (Map.Entry<String, Long> group : groups.entrySet()) {
			pdf.field(group.getKey(), group.getValue());
		}
		pdf.space(8);
	}

	private long count(List<AdoptionApplication> applications, ApplicationStatus status) {
		return applications.stream().filter(a -> a.getStatus() == status).count();
	}

	private long percent(long value, long total) {
		return total == 0 ? 0 : Math.round(value * 100.0 / total);
	}
}
