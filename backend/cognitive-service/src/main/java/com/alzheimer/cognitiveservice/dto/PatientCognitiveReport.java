package com.alzheimer.cognitiveservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Comprehensive cognitive health report for a patient.
 * Combines score, trends, alerts, and recommendations.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PatientCognitiveReport {
    private String patientId;
    private CognitiveScoreResponse cognitiveScore;
    private List<TrendAnalysisResponse> trends;
    private List<DeclineAlertResponse> activeAlerts;
    private Integer totalGamesPlayed;
    private String recommendation;
    private LocalDateTime generatedAt;
}
