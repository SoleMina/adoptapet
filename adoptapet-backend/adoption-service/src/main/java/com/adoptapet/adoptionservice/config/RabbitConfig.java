package com.adoptapet.adoptionservice.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.adoptapet.common.event.EventTypes;

/** adoption-service only publishes; each consumer declares its own queue. */
@Configuration
public class RabbitConfig {

	@Bean
	public TopicExchange eventsExchange() {
		return new TopicExchange(EventTypes.EXCHANGE);
	}

	@Bean
	public MessageConverter messageConverter() {
		return new JacksonJsonMessageConverter("com.adoptapet.common.event");
	}
}
