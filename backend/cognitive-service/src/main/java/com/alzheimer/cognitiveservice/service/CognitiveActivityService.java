package com.alzheimer.cognitiveservice.service;

import com.alzheimer.cognitiveservice.config.RabbitMQConfig;
import com.alzheimer.cognitiveservice.dto.ActivityRequest;
import com.alzheimer.cognitiveservice.dto.ActivityResponse;
import com.alzheimer.cognitiveservice.entity.CognitiveActivity;
import com.alzheimer.cognitiveservice.repository.CognitiveActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CognitiveActivityService {

    private final CognitiveActivityRepository repository;
    private final RabbitTemplate rabbitTemplate;

    public ActivityResponse saveActivity(ActivityRequest request) {
        CognitiveActivity activity = CognitiveActivity.builder()
                .patientId(request.getPatientId())
                .gameType(request.getGameType())
                .score(request.getScore())
                .durationMs(request.getDurationMs())
                .timestamp(LocalDateTime.now())
                .build();

        CognitiveActivity saved = repository.save(activity);
        
        ActivityResponse response = mapToResponse(saved);
        
        // Publish event to RabbitMQ
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.ROUTING_KEY, response);
            log.info("Published activity message to RabbitMQ for patient: {}", request.getPatientId());
        } catch (Exception e) {
            log.error("Failed to publish RabbitMQ message", e);
        }

        return response;
    }

    public List<ActivityResponse> getPatientActivities(String patientId) {
        return repository.findByPatientId(patientId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void deleteActivity(Long id) {
        repository.deleteById(id);
        log.info("Deleted cognitive activity with id: {}", id);
    }

    private ActivityResponse mapToResponse(CognitiveActivity activity) {
        return ActivityResponse.builder()
                .id(activity.getId())
                .patientId(activity.getPatientId())
                .gameType(activity.getGameType())
                .score(activity.getScore())
                .durationMs(activity.getDurationMs())
                .timestamp(activity.getTimestamp())
                .build();
    }
}
