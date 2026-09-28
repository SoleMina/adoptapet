package com.adoptapet.adoptionservice.client;

import java.util.List;
import java.util.Optional;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.adoptapet.shared.exception.ApiException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class PetClient {

	private final RestClient restClient;

	public PetClient(@LoadBalanced RestClient.Builder loadBalancedBuilder) {
		this.restClient = loadBalancedBuilder.baseUrl("http://pet-service").build();
	}

	public PetInfo getPet(Long petId) {
		try {
			return restClient.get().uri("/api/pets/{id}", petId).retrieve().body(PetInfo.class);
		} catch (HttpClientErrorException.NotFound e) {
			throw ApiException.notFound("Pet not found");
		} catch (RestClientException | IllegalStateException e) {
			log.error("pet-service call failed", e);
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "pet-service is not available");
		}
	}

	/** status = null returns every pet except INACTIVE ones. */
	public List<PetInfo> getPets(String status) {
		try {
			return restClient.get()
					.uri(uri -> uri.path("/api/pets").queryParamIfPresent("status", Optional.ofNullable(status)).build())
					.retrieve()
					.body(new ParameterizedTypeReference<List<PetInfo>>() {
					});
		} catch (RestClientException | IllegalStateException e) {
			log.error("pet-service call failed", e);
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "pet-service is not available");
		}
	}
}
