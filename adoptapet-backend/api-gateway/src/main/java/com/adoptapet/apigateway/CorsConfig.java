package com.adoptapet.apigateway;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

/**
 * CORS lives only here: the browser talks to the gateway, never to the services directly.
 * The preflight (OPTIONS) is answered by the gateway and is not forwarded.
 */
@Configuration
public class CorsConfig {

	/** Comma separated, e.g. http://localhost:4200,https://adoptapet.example.com */
	@Value("${app.cors.allowed-origins}")
	private List<String> allowedOrigins;

	@Bean
	public CorsWebFilter corsWebFilter() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(allowedOrigins);
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
		// Lets the frontend read the PDF file name (act and report downloads)
		config.setExposedHeaders(List.of("Content-Disposition"));
		config.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", config);
		return new CorsWebFilter(source);
	}
}
