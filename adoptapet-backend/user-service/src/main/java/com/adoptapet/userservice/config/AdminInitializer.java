package com.adoptapet.userservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.adoptapet.userservice.model.Role;
import com.adoptapet.userservice.model.User;
import com.adoptapet.userservice.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** Creates the first ADMIN on startup when none exists, so the system can be used right away. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

	private final UserRepository repository;
	private final PasswordEncoder passwordEncoder;

	@Value("${app.admin.username}")
	private String username;

	@Value("${app.admin.password}")
	private String password;

	@Value("${app.admin.email}")
	private String email;

	@Override
	public void run(String... args) {
		if (repository.existsByRole(Role.ADMIN)) {
			return;
		}

		User admin = new User();
		admin.setUsername(username);
		admin.setEmail(email);
		admin.setPassword(passwordEncoder.encode(password));
		admin.setRole(Role.ADMIN);
		admin.setActive(true);
		admin.setFirstName("Admin");
		admin.setLastName("AdoptaPet");
		repository.save(admin);

		log.info("Initial admin user '{}' created", username);
	}
}
