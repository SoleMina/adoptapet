package com.adoptapet.petservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.adoptapet.shared.event.EventTypes;

@Configuration
public class RabbitConfig {

	public static final String QUEUE = "pet-service.application-events";

	@Bean
	public TopicExchange eventsExchange() {
		return new TopicExchange(EventTypes.EXCHANGE);
	}

	/** Only the events that change the pet status. */
	@Bean
	public Declarables petQueueBindings(TopicExchange eventsExchange) {
		Queue queue = QueueBuilder.durable(QUEUE).build();
		Binding approved = BindingBuilder.bind(queue).to(eventsExchange).with(EventTypes.routingKey(EventTypes.APPROVED));
		Binding cancelled = BindingBuilder.bind(queue).to(eventsExchange).with(EventTypes.routingKey(EventTypes.CANCELLED));
		Binding completed = BindingBuilder.bind(queue).to(eventsExchange).with(EventTypes.routingKey(EventTypes.COMPLETED));
		return new Declarables(queue, approved, cancelled, completed);
	}

	@Bean
	public MessageConverter messageConverter() {
		return new JacksonJsonMessageConverter("com.adoptapet.shared.event");
	}
}
