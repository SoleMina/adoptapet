package com.adoptapet.petservice.messaging;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.adoptapet.shared.event.AdoptionEvent;
import com.adoptapet.petservice.config.RabbitConfig;
import com.adoptapet.petservice.service.PetService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApplicationEventListener {

	private final PetService petService;

	@RabbitListener(queues = RabbitConfig.QUEUE)
	public void onApplicationEvent(AdoptionEvent event) {
		log.info("Received {} for application {} (pet {})", event.getType(), event.getApplicationId(), event.getPetId());
		petService.applyApplicationEvent(event.getPetId(), event.getType());
	}
}
