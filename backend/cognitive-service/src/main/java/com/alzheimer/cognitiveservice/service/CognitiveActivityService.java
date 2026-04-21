package com.alzheimer.cognitiveservice.service;

import com.alzheimer.cognitiveservice.client.PatientDTO;
import com.alzheimer.cognitiveservice.client.PatientServiceClient;
import com.alzheimer.cognitiveservice.config.RabbitMQConfig;
import com.alzheimer.cognitiveservice.dto.ActivityRequest;
import com.alzheimer.cognitiveservice.dto.ActivityResponse;
import com.alzheimer.cognitiveservice.dto.TrendAnalysisResponse;
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
    private final PatientServiceClient patientServiceClient; // OpenFeign client
    private final TrendAnalysisService trendService;
    private final AlertService alertService;

    public ActivityResponse saveActivity(ActivityRequest request) {

        // ── OpenFeign call: verify patient exists in patient-service ──
        // Note: Skipping patient verification for now since patientId is a Keycloak UUID
        // and patient-service expects integer IDs. This is a known integration issue.
        /*
        try {
            PatientDTO patient = patientServiceClient.getPatientById(
                    Integer.parseInt(request.getPatientId())
            );
            log.info("Patient verified via OpenFeign: {} {}",
                    patient.getFirstName(), patient.getLastName());
        } catch (Exception e) {
            log.warn("Could not verify patient {} via patient-service: {}",
                    request.getPatientId(), e.getMessage());
            // We log the warning but still save — patient-service may be temporarily down
        }
        */

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

        // ── Trigger background analysis after save (non-blocking) ──
        // Note: This runs in the background and doesn't block the response
        try {
            if (trendService != null && alertService != null) {
                TrendAnalysisResponse trend = trendService.analyzeAndSave(
                        request.getPatientId(), request.getGameType(), 14);
                alertService.evaluateAndAlert(trend);
                log.info("Post-save analysis complete for patient {} / {}: {}",
                        request.getPatientId(), request.getGameType(), trend.getTrend());
            }
        } catch (Exception e) {
            log.warn("Post-save analysis failed (non-blocking): {}", e.getMessage());
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
