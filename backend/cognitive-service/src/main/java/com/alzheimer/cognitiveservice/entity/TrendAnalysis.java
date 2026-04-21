package com.alzheimer.cognitiveservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Stores statistical trend analysis results for a patient's performance
 * in a specific game type over a time period.
 */
@Entity
@Table(name = "trend_analyses")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TrendAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientId;

    /** Game type analyzed (MEMORY, REFLEX, VERBAL, etc.) */
    private String gameType;

    /** Linear regression slope (positive = improving, negative = declining) */
    private Double slope;

    /** Statistical confidence (R-squared value) */
    private Double confidence;

    /** IMPROVING, STABLE, DECLINING */
    private String trend;

    /** Percentage change over the period */
    private Double percentageChange;

    /** Number of data points used in analysis */
    private Integer dataPointsUsed;

    /** Analysis period in days */
    private Integer periodDays;

    private LocalDateTime analyzedAt;
}
