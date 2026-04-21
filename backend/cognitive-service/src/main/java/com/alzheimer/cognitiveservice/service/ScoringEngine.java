package com.alzheimer.cognitiveservice.service;

import com.alzheimer.cognitiveservice.dto.CognitiveScoreResponse;
import com.alzheimer.cognitiveservice.entity.CognitiveActivity;
import com.alzheimer.cognitiveservice.entity.CognitiveScore;
import com.alzheimer.cognitiveservice.repository.CognitiveActivityRepository;
import com.alzheimer.cognitiveservice.repository.CognitiveScoreRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ═══════════════════════════════════════════════════════════════
 *  SCORING ENGINE — Weighted Cognitive Health Score Computation
 * ═══════════════════════════════════════════════════════════════
 *
 * This is NOT a CRUD operation. It's a computational engine that:
 *
 * 1. Retrieves raw game activity data from the database
 * 2. Normalizes scores across different game types to a 0–100 scale
 * 3. Computes sub-scores for each cognitive domain
 * 4. Calculates a consistency metric (score variance analysis)
 * 5. Calculates an engagement metric (frequency of play)
 * 6. Applies a weighted formula to produce a composite health score
 * 7. Categorizes the patient's cognitive health level
 *
 * The output is a DERIVED metric that doesn't exist in the raw data.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ScoringEngine {

    private final CognitiveActivityRepository activityRepo;
    private final CognitiveScoreRepository scoreRepo;
    private final ObjectMapper objectMapper;

    // ── Weight configuration for composite score ──
    private static final double WEIGHT_REFLEX  = 0.25;
    private static final double WEIGHT_MEMORY  = 0.30;
    private static final double WEIGHT_VERBAL  = 0.25;
    private static final double WEIGHT_CONSISTENCY = 0.10;
    private static final double WEIGHT_ENGAGEMENT  = 0.10;

    // ── Normalization bounds (based on typical Alzheimer's patient ranges) ──
    private static final double REFLEX_BEST = 150.0;   // ms — best reaction time
    private static final double REFLEX_WORST = 1500.0;  // ms — worst expected (increased from 500)
    private static final double MEMORY_BEST = 15.0;     // max level reached
    private static final double MEMORY_WORST = 1.0;
    private static final double VERBAL_BEST = 80.0;     // max verbal score
    private static final double VERBAL_WORST = 0.0;

    /**
     * Computes and persists a new cognitive health score for the patient.
     *
     * @param patientId Keycloak User ID
     * @param windowDays Number of days to look back (default 30)
     * @return The computed score response
     */
    public CognitiveScoreResponse computeAndSave(String patientId, int windowDays) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(windowDays);
        List<CognitiveActivity> activities = activityRepo
                .findByPatientIdAndTimestampAfterOrderByTimestampAsc(patientId, cutoff);

        if (activities.isEmpty()) {
            log.info("No activities found for patient {} in last {} days", patientId, windowDays);
            return buildEmptyScore(patientId, windowDays);
        }

        // ── Step 1: Separate by game type ──
        Map<String, List<CognitiveActivity>> byType = activities.stream()
                .collect(Collectors.groupingBy(CognitiveActivity::getGameType));

        // ── Step 2: Compute normalized sub-scores (0–100) ──
        double reflexScore = normalizeReflex(averageScore(byType.getOrDefault("reflex", Collections.emptyList())));
        double memoryScore = normalizeMemory(averageScore(byType.getOrDefault("memory", Collections.emptyList())));
        double verbalScore = normalizeVerbal(averageScore(byType.getOrDefault("verbal", Collections.emptyList())));

        // ── Step 3: Compute behavioral metrics ──
        double consistency = computeConsistency(activities);
        double engagement = computeEngagement(activities, windowDays);

        // ── Step 4: Weighted composite formula ──
        double composite = (reflexScore * WEIGHT_REFLEX)
                         + (memoryScore * WEIGHT_MEMORY)
                         + (verbalScore * WEIGHT_VERBAL)
                         + (consistency * WEIGHT_CONSISTENCY)
                         + (engagement * WEIGHT_ENGAGEMENT);

        // Clamp to 0–100
        composite = Math.max(0, Math.min(100, composite));

        // ── Step 5: Build breakdown map ──
        Map<String, Double> breakdown = new LinkedHashMap<>();
        breakdown.put("reflex", round(reflexScore));
        breakdown.put("memory", round(memoryScore));
        breakdown.put("verbal", round(verbalScore));
        breakdown.put("consistency", round(consistency));
        breakdown.put("engagement", round(engagement));

        String category = categorize(composite);

        // ── Step 6: Persist ──
        String breakdownJson;
        try {
            breakdownJson = objectMapper.writeValueAsString(breakdown);
        } catch (JsonProcessingException e) {
            breakdownJson = "{}";
        }

        CognitiveScore entity = CognitiveScore.builder()
                .patientId(patientId)
                .overallScore(round(composite))
                .category(category)
                .breakdownJson(breakdownJson)
                .dataPointsUsed(activities.size())
                .windowDays(windowDays)
                .computedAt(LocalDateTime.now())
                .build();

        CognitiveScore saved = scoreRepo.save(entity);
        log.info("Computed cognitive score {} ({}) for patient {} using {} data points",
                round(composite), category, patientId, activities.size());

        return mapToResponse(saved, breakdown);
    }

    /**
     * Get the latest score without recomputing.
     */
    public Optional<CognitiveScoreResponse> getLatestScore(String patientId) {
        return scoreRepo.findTopByPatientIdOrderByComputedAtDesc(patientId)
                .map(s -> mapToResponse(s, parseBreakdown(s.getBreakdownJson())));
    }

    // ════════════════════════════════════════════════════════
    //  NORMALIZATION ALGORITHMS — Domain-specific transforms
    // ════════════════════════════════════════════════════════

    /**
     * Reflex: LOWER is better (reaction time in ms).
     * Inverted normalization: 150ms → 100, 500ms → 0.
     */
    private double normalizeReflex(double avgMs) {
        if (avgMs <= 0) return 0;
        double normalized = (REFLEX_WORST - avgMs) / (REFLEX_WORST - REFLEX_BEST) * 100;
        return Math.max(0, Math.min(100, normalized));
    }

    /**
     * Memory: HIGHER is better (max sequence level).
     * Linear normalization: 1 → 0, 15 → 100.
     */
    private double normalizeMemory(double avgLevel) {
        if (avgLevel <= 0) return 0;
        double normalized = (avgLevel - MEMORY_WORST) / (MEMORY_BEST - MEMORY_WORST) * 100;
        return Math.max(0, Math.min(100, normalized));
    }

    /**
     * Verbal: HIGHER is better (words correctly identified).
     * Linear normalization: 0 → 0, 80 → 100.
     */
    private double normalizeVerbal(double avgScore) {
        if (avgScore <= 0) return 0;
        double normalized = (avgScore - VERBAL_WORST) / (VERBAL_BEST - VERBAL_WORST) * 100;
        return Math.max(0, Math.min(100, normalized));
    }

    // ════════════════════════════════════════════════════════
    //  BEHAVIORAL METRICS — Beyond simple scores
    // ════════════════════════════════════════════════════════

    /**
     * Consistency: measures how stable the patient's performance is.
     * Low variance = high consistency = good cognitive stability.
     * Uses coefficient of variation (CV = stddev / mean).
     */
    private double computeConsistency(List<CognitiveActivity> activities) {
        if (activities.size() < 2) return 50.0; // neutral default

        double[] scores = activities.stream()
                .mapToDouble(a -> a.getScore().doubleValue())
                .toArray();

        double mean = Arrays.stream(scores).average().orElse(0);
        if (mean == 0) return 50.0;

        double variance = Arrays.stream(scores)
                .map(s -> Math.pow(s - mean, 2))
                .average().orElse(0);
        double stddev = Math.sqrt(variance);
        double cv = stddev / Math.abs(mean); // coefficient of variation

        // CV of 0 = perfect consistency (100), CV > 1 = very inconsistent (0)
        double consistency = (1 - Math.min(cv, 1.0)) * 100;
        return Math.max(0, Math.min(100, consistency));
    }

    /**
     * Engagement: measures how frequently the patient plays.
     * Based on the ratio of active days to total days in the window.
     */
    private double computeEngagement(List<CognitiveActivity> activities, int windowDays) {
        if (windowDays <= 0) return 0;

        long uniqueDays = activities.stream()
                .map(a -> a.getTimestamp().toLocalDate())
                .distinct()
                .count();

        // If they played on 50%+ of days, that's great engagement
        double ratio = (double) uniqueDays / windowDays;
        double engagement = Math.min(ratio * 200, 100); // 50% active days = 100 score
        return Math.max(0, engagement);
    }

    // ════════════════════════════════════════════════════════
    //  CATEGORIZATION — Clinical classification
    // ════════════════════════════════════════════════════════

    private String categorize(double score) {
        if (score >= 75) return "HEALTHY";
        if (score >= 50) return "MILD_DECLINE";
        if (score >= 25) return "MODERATE_DECLINE";
        return "SEVERE_DECLINE";
    }

    // ── Utility methods ──

    private double averageScore(List<CognitiveActivity> activities) {
        return activities.stream()
                .mapToDouble(a -> a.getScore().doubleValue())
                .average()
                .orElse(0);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private CognitiveScoreResponse buildEmptyScore(String patientId, int windowDays) {
        return CognitiveScoreResponse.builder()
                .patientId(patientId)
                .overallScore(0.0)
                .category("INSUFFICIENT_DATA")
                .breakdown(Map.of())
                .dataPointsUsed(0)
                .windowDays(windowDays)
                .computedAt(LocalDateTime.now())
                .build();
    }

    private CognitiveScoreResponse mapToResponse(CognitiveScore entity, Map<String, Double> breakdown) {
        return CognitiveScoreResponse.builder()
                .id(entity.getId())
                .patientId(entity.getPatientId())
                .overallScore(entity.getOverallScore())
                .category(entity.getCategory())
                .breakdown(breakdown)
                .dataPointsUsed(entity.getDataPointsUsed())
                .windowDays(entity.getWindowDays())
                .computedAt(entity.getComputedAt())
                .build();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Double> parseBreakdown(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }
}
