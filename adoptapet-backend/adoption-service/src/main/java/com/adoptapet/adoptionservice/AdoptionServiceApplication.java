package com.adoptapet.adoptionservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.adoptapet")
public class AdoptionServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(AdoptionServiceApplication.class, args);
	}
}
