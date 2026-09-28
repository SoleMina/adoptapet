package com.adoptapet.adoptionservice.config;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class AppConfig {

	/** Business dates (delivery windows, deadlines) are always evaluated in Peru time. */
	@Bean
	public Clock clock(@Value("${app.time-zone}") String timeZone) {
		return Clock.system(ZoneId.of(timeZone));
	}

	/**
	 * Plain builder for infrastructure (the Eureka client itself uses it to reach http://localhost:8761).
	 * Without it, Eureka would pick the load-balanced one and try to resolve "localhost" as a service.
	 */
	@Bean
	@Primary
	public RestClient.Builder restClientBuilder() {
		return RestClient.builder();
	}

	/**
	 * Resolves http://user-service and http://pet-service through Eureka and forwards the caller's JWT,
	 * so the other services apply their own permission rules. Inject it with @LoadBalanced.
	 */
	@Bean
	@LoadBalanced
	public RestClient.Builder loadBalancedRestClientBuilder() {
		return RestClient.builder().requestInterceptor((request, body, execution) -> {
			if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
				String authorization = attributes.getRequest().getHeader(HttpHeaders.AUTHORIZATION);
				if (authorization != null) {
					request.getHeaders().set(HttpHeaders.AUTHORIZATION, authorization);
				}
			}
			return execution.execute(request, body);
		});
	}
}
