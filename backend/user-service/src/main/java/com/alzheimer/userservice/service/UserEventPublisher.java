package com.alzheimer.userservice.service;

import com.alzheimer.userservice.config.RabbitMQConfig;
import com.alzheimer.userservice.event.UserCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishUserCreatedEvent(UserCreatedEvent event) {
        log.info("Publishing user created event for user: {}", event.getEmail());
        
        String routingKey = "";
        if (event.getRole().name().equals("PATIENT")) {
            routingKey = RabbitMQConfig.ROUTING_KEY_PATIENT;
        } else {
            // Can add more routing keys for other roles if needed
            log.debug("No specific routing key for role: {}", event.getRole());
            return;
        }

        log.info("Sending message to exchange: '{}' with routing key: '{}'", RabbitMQConfig.EXCHANGE, routingKey);
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, routingKey, event);
        log.info("Successfully sent message to RabbitMQ for user: {}", event.getEmail());
    }
}
