package com.alzheimer.cognitiveservice.service;

import com.alzheimer.cognitiveservice.dto.DeclineAlertResponse;
import com.alzheimer.cognitiveservice.dto.TrendAnalysisResponse;
import com.alzheimer.cognitiveservice.entity.DeclineAlert;
import com.alzheimer.cognitiveservice.repository.DeclineAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Manages cognitive decline alerts.
 * Automatically creates alerts when significant performance drops are detected.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final DeclineAlertRepository alertRepository;

    /**
     * Evaluate a trend analysis and create an alert if decline is detected.
     */
    @Transactional
    public void evaluateAndAlert(TrendAnalysisResponse trend) {
        if (!"DECLINING".equals(trend.getTrend())) {
            return; // No alert needed
        }

        String severity = determineSeverity(trend.getSlope(), trend.getPercentageChange());
        String message = buildAlertMessage(trend);

        DeclineAlert alert = DeclineAlert.builder()
                .patientId(trend.getPatientId())
                .severity(severity)
                .message(message)
                .gameType(trend.getGameType())
                .triggerSlope(trend.getSlope())
                .confidence(trend.getConfidence())
                .acknowledged(false)
                .createdAt(LocalDateTime.now())
                .build();

        alertRepository.save(alert);
        log.warn("ALERT CREATED: {} - {} for patient {} ({})",
                severity, trend.getGameType(), trend.getPatientId(), message);
    }

    /**
     * Create an alert based on overall cognitive score decline.
     * This is called when the overall health score indicates severe decline.
     */
    @Transactional
    public void createScoreBasedAlert(String patientId, String category, double score) {
        // Only create alerts for significant decline
        if ("SEVERE_DECLINE".equals(category) || "MODERATE_DECLINE".equals(category)) {
            String severity = "SEVERE_DECLINE".equals(category) ? "CRITICAL" : "HIGH";
            String message = String.format(
                "Patient's overall cognitive health score is %s (%.1f/100). Category: %s. Comprehensive assessment recommended.",
                severity.toLowerCase(), score, category);

            DeclineAlert alert = DeclineAlert.builder()
                    .patientId(patientId)
                    .severity(severity)
                    .message(message)
                    .gameType("OVERALL")
                    .triggerSlope(0.0)
                    .confidence(1.0)
                    .acknowledged(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            alertRepository.save(alert);
            log.warn("SCORE-BASED ALERT CREATED: {} for patient {} (Score: {})",
                    severity, patientId, score);
        }
    }

    /**
     * Get all alerts for a patient.
     */
    public List<DeclineAlertResponse> getAlerts(String patientId) {
        return alertRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get only active (unacknowledged) alerts.
     */
    public List<DeclineAlertResponse> getActiveAlerts(String patientId) {
        return alertRepository.findByPatientIdAndAcknowledgedFalseOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Acknowledge an alert (mark as read by a doctor).
     */
    @Transactional
    public DeclineAlertResponse acknowledgeAlert(Long alertId) {
        DeclineAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + alertId));

        alert.setAcknowledged(true);
        alert.setAcknowledgedAt(LocalDateTime.now());
        DeclineAlert updated = alertRepository.save(alert);

        log.info("Alert {} acknowledged for patient {}", alertId, alert.getPatientId());
        return mapToResponse(updated);
    }

    private String determineSeverity(Double slope, Double percentageChange) {
        double absSlope = Math.abs(slope);
        double absChange = Math.abs(percentageChange);

        if (absSlope > 2.0 || absChange > 40) return "CRITICAL";
        if (absSlope > 1.0 || absChange > 25) return "HIGH";
        if (absSlope > 0.5 || absChange > 15) return "MEDIUM";
        return "LOW";
    }

    private String buildAlertMessage(TrendAnalysisResponse trend) {
        String gameType = trend.getGameType().toLowerCase();
        double change = Math.abs(trend.getPercentageChange());
        
        return String.format("Patient's %s performance has decreased by approximately %.1f%% over the last %d days. " +
                        "Statistical analysis (R²=%.2f) indicates a declining trend requiring attention.",
                gameType, change, trend.getPeriodDays(), trend.getConfidence());
    }

    private DeclineAlertResponse mapToResponse(DeclineAlert entity) {
        return DeclineAlertResponse.builder()
                .id(entity.getId())
                .patientId(entity.getPatientId())
                .severity(entity.getSeverity())
                .message(entity.getMessage())
                .gameType(entity.getGameType())
                .triggerSlope(entity.getTriggerSlope())
                .confidence(entity.getConfidence())
                .acknowledged(entity.getAcknowledged())
                .createdAt(entity.getCreatedAt())
                .acknowledgedAt(entity.getAcknowledgedAt())
                .build();
    }
}
