package com.adoptapet.apigateway;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Single entry point (port 8080). "lb://" resolves each service through Eureka. */
@Configuration
public class Routes {

	@Bean
	public RouteLocator apiRoutes(RouteLocatorBuilder builder) {
		return builder.routes()
				.route("users", r -> r.path("/api/auth/**", "/api/users/**")
						.uri("lb://user-service"))
				.route("pets", r -> r.path("/api/pets/**")
						.uri("lb://pet-service"))
				.route("adoptions", r -> r.path("/api/applications/**", "/api/delivery-slots/**", "/api/adopters/**", "/api/reports/**")
						.uri("lb://adoption-service"))
				.route("notifications", r -> r.path("/api/notifications/**")
						.uri("lb://notification-service"))
				.build();
	}
}
