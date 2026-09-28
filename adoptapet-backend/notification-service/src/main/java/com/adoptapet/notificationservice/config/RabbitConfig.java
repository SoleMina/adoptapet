package com.adoptapet.notificationservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.adoptapet.common.event.EventTypes;

@Configuration
public class RabbitConfig {

	public static final String QUEUE = "notification-service.application-events";

	@Bean
	public TopicExchange eventsExchange() {
		return new TopicExchange(EventTypes.EXCHANGE);
	}

	@Bean
	public Queue notificationQueue() {
		return QueueBuilder.durable(QUEUE).build();
	}

	/** Every application event: "application.*". */
	@Bean
	public Binding notificationBinding(Queue notificationQueue, TopicExchange eventsExchange) {
		return BindingBuilder.bind(notificationQueue).to(eventsExchange).with(EventTypes.ROUTING_PREFIX + "*");
	}

	@Bean
	public MessageConverter messageConverter() {
		return new JacksonJsonMessageConverter("com.adoptapet.common.event");
	}
}
