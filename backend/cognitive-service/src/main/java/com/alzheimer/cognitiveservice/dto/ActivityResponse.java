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
public class ActivityResponse {
    private Long id;
    private String patientId;
    private String gameType;
    private Integer score;
    private Long durationMs;
    private LocalDateTime timestamp;
}
