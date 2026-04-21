package com.alzheimer.cognitiveservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TrendAnalysisResponse {
    private Long id;
    private String patientId;
    private String gameType;
    private Double slope;
    private Double confidence;
    private String trend;
    private Double percentageChange;
    private Integer dataPointsUsed;
    private Integer periodDays;
    private LocalDateTime analyzedAt;
}
