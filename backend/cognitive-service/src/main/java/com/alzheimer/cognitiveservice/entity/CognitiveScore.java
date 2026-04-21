package com.alzheimer.cognitiveservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Stores a computed cognitive health score for a patient.
 * This is NOT raw data — it's a derived metric computed by the ScoringEngine
 * using weighted algorithms across all game types.
 */
@Entity
@Table(name = "cognitive_scores")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CognitiveScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientId;

    /** Composite score from 0 to 100 */
    private Double overallScore;

    /** Category: HEALTHY, MILD_DECLINE, MODERATE_DECLINE, SEVERE_DECLINE */
    private String category;

    /** Individual sub-scores stored as JSON string */
    @Column(columnDefinition = "TEXT")
    private String breakdownJson;

    /** Number of activities used in computation */
    private Integer dataPointsUsed;

    /** Analysis window in days */
    private Integer windowDays;

    private LocalDateTime computedAt;
}
