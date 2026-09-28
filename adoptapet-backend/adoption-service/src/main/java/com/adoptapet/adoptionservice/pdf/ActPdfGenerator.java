package com.adoptapet.adoptionservice.pdf;

import java.io.IOException;
import java.time.Clock;
import java.time.LocalDate;

import org.springframework.stereotype.Component;

import com.adoptapet.adoptionservice.client.PetInfo;
import com.adoptapet.adoptionservice.client.UserInfo;
import com.adoptapet.adoptionservice.model.AdoptionApplication;
import com.adoptapet.adoptionservice.model.DeliveryAppointment;

import lombok.RequiredArgsConstructor;

/** Adoption act that the adopter and the responsible worker sign on delivery day. */
@Component
@RequiredArgsConstructor
public class ActPdfGenerator {

	private static final String COMMITMENT = "The adopter declares to take full responsibility for the care, feeding, health "
			+ "and well-being of the adopted pet, and commits to provide it with a safe and suitable home.";

	private final Clock clock;

	public byte[] generate(AdoptionApplication application, DeliveryAppointment appointment, UserInfo adopter,
			PetInfo pet, UserInfo worker) throws IOException {

		try (PdfWriter pdf = new PdfWriter("Adoption act")) {
			pdf.header("ADOPTION ACT", "Application #" + application.getId() + " - generated on " + LocalDate.now(clock));

			pdf.section("Adopter");
			pdf.field("Name", adopter.getFullName());
			pdf.field("DNI", adopter.getDni());
			pdf.field("Phone", adopter.getPhone());
			pdf.field("Email", adopter.getEmail());
			pdf.field("Address", adopter.getAddress());
			pdf.space(8);

			pdf.section("Pet");
			pdf.field("Name", pet.getName());
			pdf.field("Species", pet.getSpecies());
			pdf.field("Breed", pet.getBreed());
			pdf.field("Sex", pet.getSex());
			pdf.field("Age", pet.getAgeYears() + " years and " + pet.getAgeMonths() + " months");
			pdf.field("Health status", pet.getHealthStatus());
			pdf.space(8);

			pdf.section("Application form");
			pdf.field("Adoption reason", application.getAdoptionReason());
			pdf.field("Housing type", application.getHousingType());
			pdf.field("Experience with pets", application.getPetExperience());
			pdf.field("Other pets", application.getOtherPets());
			pdf.field("People at home", application.getHouseholdSize());
			pdf.field("Comments", application.getComments());
			pdf.space(8);

			pdf.section("Delivery");
			pdf.field("Date", appointment.getDeliveryDate());
			pdf.field("Window", appointment.getStartTime() + " - " + appointment.getEndTime());
			pdf.space(8);

			pdf.section("Responsible worker");
			pdf.field("Name", worker.getFullName());
			pdf.field("DNI", worker.getDni());
			pdf.field("Email", worker.getEmail());
			pdf.space(8);

			pdf.section("Commitment");
			pdf.paragraph(COMMITMENT);

			pdf.signatures("Adopter signature", "Responsible worker signature");
			return pdf.toBytes();
		}
	}
}
