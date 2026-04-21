package com.alzheimer.cognitiveservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Stores automated cognitive decline alerts.
 * These are triggered when the analysis engine detects statistically significant
 * performance drops — they're NOT manually created (non-CRUD).
 */
@Entity
@Table(name = "decline_alerts")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DeclineAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientId;

    /** LOW, MEDIUM, HIGH, CRITICAL */
    private String severity;

    /** Human-readable alert message */
    @Column(columnDefinition = "TEXT")
    private String message;

    /** Which game type triggered the alert (or "overall") */
    private String gameType;

    /** The slope value that triggered the alert */
    private Double triggerSlope;

    /** Confidence of the decline detection */
    private Double confidence;

    /** false = unread, true = acknowledged by a doctor */
    private Boolean acknowledged;

    private LocalDateTime createdAt;

    private LocalDateTime acknowledgedAt;
}
