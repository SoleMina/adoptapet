package com.adoptapet.adoptionservice.client;

import java.util.List;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.adoptapet.shared.exception.ApiException;

import lombok.extern.slf4j.Slf4j;

/** Calls user-service with the caller's token, so only staff can read other users. */
@Slf4j
@Component
public class UserClient {

	private final RestClient restClient;

	public UserClient(@LoadBalanced RestClient.Builder loadBalancedBuilder) {
		this.restClient = loadBalancedBuilder.baseUrl("http://user-service").build();
	}

	public UserInfo getUser(Long userId) {
		try {
			return restClient.get().uri("/api/users/{id}", userId).retrieve().body(UserInfo.class);
		} catch (HttpClientErrorException.NotFound e) {
			throw ApiException.notFound("User not found");
		} catch (RestClientException | IllegalStateException e) {
			log.error("user-service call failed", e);
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "user-service is not available");
		}
	}

	public List<UserInfo> getAdopters() {
		try {
			return restClient.get().uri("/api/users?role=ADOPTER").retrieve()
					.body(new ParameterizedTypeReference<List<UserInfo>>() {
					});
		} catch (RestClientException | IllegalStateException e) {
			log.error("user-service call failed", e);
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "user-service is not available");
		}
	}
}
