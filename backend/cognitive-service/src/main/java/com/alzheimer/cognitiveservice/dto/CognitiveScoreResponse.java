package com.alzheimer.cognitiveservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CognitiveScoreResponse {
    private Long id;
    private String patientId;
    private Double overallScore;
    private String category;
    private Map<String, Double> breakdown;
    private Integer dataPointsUsed;
    private Integer windowDays;
    private LocalDateTime computedAt;
}
