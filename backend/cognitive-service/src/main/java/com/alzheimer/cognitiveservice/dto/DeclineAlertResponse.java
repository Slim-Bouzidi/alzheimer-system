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
public class DeclineAlertResponse {
    private Long id;
    private String patientId;
    private String severity;
    private String message;
    private String gameType;
    private Double triggerSlope;
    private Double confidence;
    private Boolean acknowledged;
    private LocalDateTime createdAt;
    private LocalDateTime acknowledgedAt;
}
