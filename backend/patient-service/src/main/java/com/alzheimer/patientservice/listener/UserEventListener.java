package com.alzheimer.patientservice.listener;

import com.alzheimer.patientservice.config.RabbitMQConfig;
import com.alzheimer.patientservice.dto.PatientRequest;
import com.alzheimer.patientservice.event.UserCreatedEvent;
import com.alzheimer.patientservice.service.PatientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventListener {

    private final PatientService patientService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_PATIENT)
    public void handleUserCreatedEvent(UserCreatedEvent event) {
        log.info("Received user created event for patient: {}", event.getEmail());

        try {
            PatientRequest request = new PatientRequest();
            request.setUserId(event.getUserId());
            request.setKeycloakId(event.getKeycloakId());
            request.setFirstName(event.getFirstName());
            request.setLastName(event.getLastName());
            
            patientService.create(request);
            log.info("Successfully created patient record for user: {}", event.getEmail());
            
        } catch (Exception e) {
            log.error("Failed to create patient record from event", e);
            // In a production app, we might want to throw an exception to trigger a retry
            // Or send to a Dead Letter Queue (DLQ)
        }
    }
}
