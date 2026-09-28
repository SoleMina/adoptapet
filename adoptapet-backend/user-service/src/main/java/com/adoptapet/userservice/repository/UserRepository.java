package com.adoptapet.userservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.adoptapet.userservice.model.Role;
import com.adoptapet.userservice.model.User;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByUsername(String username);

	List<User> findByRoleOrderByIdAsc(Role role);

	boolean existsByRole(Role role);

	boolean existsByUsername(String username);

	boolean existsByEmail(String email);

	boolean existsByDni(String dni);

	boolean existsByEmailAndIdNot(String email, Long id);

	boolean existsByDniAndIdNot(String dni, Long id);
}
