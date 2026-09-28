package com.adoptapet.petservice.service;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.adoptapet.common.event.EventTypes;
import com.adoptapet.common.exception.ApiException;
import com.adoptapet.petservice.dto.PetRequest;
import com.adoptapet.petservice.dto.PetResponse;
import com.adoptapet.petservice.model.AdoptionStatus;
import com.adoptapet.petservice.model.Pet;
import com.adoptapet.petservice.repository.PetRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PetService {

	private final PetRepository repository;
	private final ImageStorageService imageStorage;

	/**
	 * Without a status filter, inactive pets are hidden. Staff can ask for them with status=INACTIVE.
	 */
	@Transactional(readOnly = true)
	public List<PetResponse> findAll(AdoptionStatus status, String species) {
		List<Pet> pets = status == null
				? repository.findByAdoptionStatusNotOrderByIdDesc(AdoptionStatus.INACTIVE)
				: repository.findByAdoptionStatusOrderByIdDesc(status);

		return pets.stream()
				.filter(pet -> species == null || species.isBlank() || pet.getSpecies().equalsIgnoreCase(species.trim()))
				.map(PetResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public PetResponse findById(Long id) {
		return PetResponse.from(getPet(id));
	}

	@Transactional
	public PetResponse create(PetRequest request, MultipartFile image) {
		if (repository.existsByNameIgnoreCaseAndSpeciesIgnoreCaseAndBreedIgnoreCaseAndAdoptionStatusNot(
				request.getName().trim(), request.getSpecies().trim(), request.getBreed().trim(), AdoptionStatus.INACTIVE)) {
			throw ApiException.conflict("An active pet with the same name, species and breed already exists");
		}

		Pet pet = new Pet();
		copyFields(request, pet);
		pet.setAdoptionStatus(AdoptionStatus.AVAILABLE);
		if (hasFile(image)) {
			pet.setImageName(imageStorage.save(image));
		}
		return PetResponse.from(repository.saveAndFlush(pet));
	}

	@Transactional
	public PetResponse update(Long id, PetRequest request, MultipartFile image) {
		Pet pet = getPet(id);
		checkVersion(pet, request.getVersion());

		if (repository.existsByNameIgnoreCaseAndSpeciesIgnoreCaseAndBreedIgnoreCaseAndAdoptionStatusNotAndIdNot(
				request.getName().trim(), request.getSpecies().trim(), request.getBreed().trim(), AdoptionStatus.INACTIVE, id)) {
			throw ApiException.conflict("An active pet with the same name, species and breed already exists");
		}

		copyFields(request, pet);
		if (hasFile(image)) {
			String oldImage = pet.getImageName();
			pet.setImageName(imageStorage.save(image));
			imageStorage.delete(oldImage);
		}
		return PetResponse.from(repository.saveAndFlush(pet));
	}

	/** Logical delete. Only pets without an adoption in progress can be removed. */
	@Transactional
	public PetResponse deactivate(Long id, Long version) {
		Pet pet = getPet(id);
		checkVersion(pet, version);

		if (pet.getAdoptionStatus() != AdoptionStatus.AVAILABLE) {
			throw ApiException.conflict("Only available pets can be deactivated");
		}
		pet.setAdoptionStatus(AdoptionStatus.INACTIVE);
		return PetResponse.from(repository.saveAndFlush(pet));
	}

	@Transactional
	public PetResponse activate(Long id) {
		Pet pet = getPet(id);

		if (pet.getAdoptionStatus() != AdoptionStatus.INACTIVE) {
			throw ApiException.conflict("Only inactive pets can be activated");
		}
		pet.setAdoptionStatus(AdoptionStatus.AVAILABLE);
		return PetResponse.from(repository.saveAndFlush(pet));
	}

	/**
	 * Called from RabbitMQ. adoption-service decides; this only mirrors the result on the pet.
	 * Idempotent: receiving the same event twice leaves the same status.
	 */
	@Transactional
	public void applyApplicationEvent(Long petId, String eventType) {
		Pet pet = repository.findById(petId).orElse(null);
		if (pet == null) {
			return;
		}

		switch (eventType) {
			case EventTypes.APPROVED -> pet.setAdoptionStatus(AdoptionStatus.RESERVED);
			case EventTypes.COMPLETED -> pet.setAdoptionStatus(AdoptionStatus.ADOPTED);
			case EventTypes.CANCELLED -> {
				if (pet.getAdoptionStatus() == AdoptionStatus.RESERVED) {
					pet.setAdoptionStatus(AdoptionStatus.AVAILABLE);
				}
			}
			default -> {
				return;
			}
		}
		repository.save(pet);
	}

	private Pet getPet(Long id) {
		return repository.findById(id).orElseThrow(() -> ApiException.notFound("Pet not found"));
	}

	private void checkVersion(Pet pet, Long version) {
		if (version == null) {
			throw ApiException.badRequest("The pet version is required");
		}
		if (!Objects.equals(pet.getVersion(), version)) {
			throw ApiException.conflict("The pet was modified by another user. Reload it and try again");
		}
	}

	private void copyFields(PetRequest request, Pet pet) {
		pet.setName(request.getName().trim());
		pet.setSpecies(request.getSpecies().trim());
		pet.setBreed(request.getBreed().trim());
		pet.setSex(request.getSex());
		pet.setAgeYears(request.getAgeYears());
		pet.setAgeMonths(request.getAgeMonths());
		pet.setHealthStatus(request.getHealthStatus());
		pet.setSterilizationStatus(request.getSterilizationStatus());
		pet.setObservations(request.getObservations());
	}

	private boolean hasFile(MultipartFile file) {
		return file != null && !file.isEmpty();
	}
}
