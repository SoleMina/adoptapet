package com.adoptapet.petservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.adoptapet.petservice.model.AdoptionStatus;
import com.adoptapet.petservice.model.Pet;

public interface PetRepository extends JpaRepository<Pet, Long> {

	List<Pet> findByAdoptionStatusOrderByIdDesc(AdoptionStatus status);

	List<Pet> findByAdoptionStatusNotOrderByIdDesc(AdoptionStatus status);

	/** Same name + species + breed among pets that are still in the catalog. */
	boolean existsByNameIgnoreCaseAndSpeciesIgnoreCaseAndBreedIgnoreCaseAndAdoptionStatusNot(
			String name, String species, String breed, AdoptionStatus status);

	boolean existsByNameIgnoreCaseAndSpeciesIgnoreCaseAndBreedIgnoreCaseAndAdoptionStatusNotAndIdNot(
			String name, String species, String breed, AdoptionStatus status, Long id);
}
