package com.adoptapet.shared.security;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * JwtFilter is a @Component, so Spring Boot would also register it as a plain
 * servlet filter. It must only run inside the Spring Security chain.
 */
@Configuration
public class JwtFilterRegistration {

	@Bean
	public FilterRegistrationBean<JwtFilter> jwtFilterServletRegistration(JwtFilter filter) {
		FilterRegistrationBean<JwtFilter> registration = new FilterRegistrationBean<>(filter);
		registration.setEnabled(false);
		return registration;
	}
}
