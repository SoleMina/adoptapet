package com.adoptapet.notificationservice.messaging;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.adoptapet.shared.event.AdoptionEvent;
import com.adoptapet.notificationservice.config.RabbitConfig;
import com.adoptapet.notificationservice.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdoptionEventListener {

	private final NotificationService notificationService;

	@RabbitListener(queues = RabbitConfig.QUEUE)
	public void onAdoptionEvent(AdoptionEvent event) {
		log.info("Received {} for application {} (adopter {})", event.getType(), event.getApplicationId(), event.getAdopterId());
		notificationService.handle(event);
	}
}
