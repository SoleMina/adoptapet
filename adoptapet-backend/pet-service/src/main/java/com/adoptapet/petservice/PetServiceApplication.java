package com.adoptapet.petservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.adoptapet")
public class PetServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(PetServiceApplication.class, args);
	}
}
