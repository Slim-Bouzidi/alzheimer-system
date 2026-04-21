package com.alzheimer.cognitiveservice.service;

import com.alzheimer.cognitiveservice.dto.CognitiveScoreResponse;
import com.alzheimer.cognitiveservice.dto.DeclineAlertResponse;
import com.alzheimer.cognitiveservice.dto.PatientCognitiveReport;
import com.alzheimer.cognitiveservice.dto.TrendAnalysisResponse;
import com.alzheimer.cognitiveservice.entity.CognitiveActivity;
import com.alzheimer.cognitiveservice.repository.CognitiveActivityRepository;
import com.alzheimer.cognitiveservice.repository.CognitiveScoreRepository;
import com.alzheimer.cognitiveservice.repository.DeclineAlertRepository;
import com.alzheimer.cognitiveservice.repository.TrendAnalysisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Orchestrates the complete cognitive analysis pipeline.
 * Combines scoring, trend analysis, and alert generation into comprehensive reports.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CognitiveAnalysisService {

    private final ScoringEngine scoringEngine;
    private final TrendAnalysisService trendService;
    private final AlertService alertService;
    private final CognitiveActivityRepository activityRepository;
    private final CognitiveScoreRepository scoreRepository;
    private final TrendAnalysisRepository trendRepository;
    private final DeclineAlertRepository alertRepository;

    /**
     * Run a complete cognitive analysis pipeline for a patient.
     * This is the main "wow" method that generates a comprehensive report.
     */
    @Transactional
    public PatientCognitiveReport runFullAnalysis(String patientId) {
        log.info("Starting full cognitive analysis for patient: {}", patientId);

        // Step 1: Compute cognitive score
        CognitiveScoreResponse score = scoringEngine.computeAndSave(patientId, 30);

        // Step 2: Analyze trends for all game types
        List<TrendAnalysisResponse> trends = trendService.analyzeAll(patientId, 14);

        // Step 3: Evaluate trends and generate alerts
        for (TrendAnalysisResponse trend : trends) {
            try {
                alertService.evaluateAndAlert(trend);
            } catch (Exception e) {
                log.warn("Failed to evaluate alert for trend: {}", e.getMessage());
            }
        }

        // Step 3b: Create alert if overall score indicates severe/moderate decline
        if (score != null) {
            try {
                alertService.createScoreBasedAlert(patientId, score.getCategory(), score.getOverallScore());
            } catch (Exception e) {
                log.warn("Failed to create score-based alert: {}", e.getMessage());
            }
        }

        // Step 4: Get active alerts
        List<DeclineAlertResponse> activeAlerts = alertService.getActiveAlerts(patientId);

        // Step 5: Generate recommendation
        String recommendation = generateRecommendation(score, trends, activeAlerts);

        // Step 6: Count total games played
        List<CognitiveActivity> allActivities = activityRepository.findByPatientId(patientId);
        int totalGamesPlayed = allActivities.size();

        PatientCognitiveReport report = PatientCognitiveReport.builder()
                .patientId(patientId)
                .cognitiveScore(score)
                .trends(trends)
                .activeAlerts(activeAlerts)
                .totalGamesPlayed(totalGamesPlayed)
                .recommendation(recommendation)
                .generatedAt(LocalDateTime.now())
                .build();

        log.info("Full analysis complete for patient {}: Score={}, Alerts={}, Trends={}",
                patientId, score.getOverallScore(), activeAlerts.size(), trends.size());

        return report;
    }

    /**
     * Get the latest report without re-running analysis.
     */
    public PatientCognitiveReport getLatestReport(String patientId) {
        CognitiveScoreResponse score = scoringEngine.getLatestScore(patientId)
                .orElse(null);

        // Fetch only the latest trend per game type the patient has actually played
        List<String> playedGameTypes = activityRepository.findDistinctGameTypesByPatientId(patientId);
        List<TrendAnalysisResponse> trends = playedGameTypes.stream()
                .map(gameType -> trendRepository.findTopByPatientIdAndGameTypeOrderByAnalyzedAtDesc(patientId, gameType))
                .filter(java.util.Optional::isPresent)
                .map(opt -> mapTrendToResponse(opt.get()))
                .toList();

        List<DeclineAlertResponse> activeAlerts = alertService.getActiveAlerts(patientId);

        String recommendation = generateRecommendation(score, trends, activeAlerts);

        List<CognitiveActivity> allActivities = activityRepository.findByPatientId(patientId);
        int totalGamesPlayed = allActivities.size();

        return PatientCognitiveReport.builder()
                .patientId(patientId)
                .cognitiveScore(score)
                .trends(trends)
                .activeAlerts(activeAlerts)
                .totalGamesPlayed(totalGamesPlayed)
                .recommendation(recommendation)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Clear all analysis data for a patient.
     * This resets computed analysis (scores, trends, alerts) but keeps raw activity data.
     */
    @Transactional
    public void resetAnalysis(String patientId) {
        log.info("Resetting analysis data for patient: {}", patientId);

        try {
            // NOTE: We do NOT delete cognitive activities - those are the raw game results
            // Users want to keep their game history even when resetting analysis

            // Delete all cognitive scores (computed metrics)
            scoreRepository.deleteByPatientId(patientId);
            log.info("Deleted scores for patient: {}", patientId);

            // Delete all trend analyses (computed trends)
            trendRepository.deleteByPatientId(patientId);
            log.info("Deleted trends for patient: {}", patientId);

            // Delete all alerts (computed alerts)
            alertRepository.deleteByPatientId(patientId);
            log.info("Deleted alerts for patient: {}", patientId);

            log.info("Successfully reset analysis data for patient: {} (activities preserved)", patientId);
        } catch (Exception e) {
            log.error("Failed to reset analysis data for patient {}: {}", patientId, e.getMessage(), e);
            throw new RuntimeException("Failed to reset analysis data: " + e.getMessage(), e);
        }
    }

    /**
     * Generate personalized recommendations based on analysis results.
     */
    private String generateRecommendation(CognitiveScoreResponse score,
                                          List<TrendAnalysisResponse> trends,
                                          List<DeclineAlertResponse> alerts) {
        List<String> recommendations = generateRecommendations(score, trends, alerts);
        return recommendations.isEmpty() ? "" : String.join("; ", recommendations);
    }

    /**
     * Generate personalized recommendations list based on analysis results.
     */
    private List<String> generateRecommendations(CognitiveScoreResponse score,
                                                   List<TrendAnalysisResponse> trends,
                                                   List<DeclineAlertResponse> alerts) {
        List<String> recommendations = new ArrayList<>();

        if (score == null) {
            recommendations.add("Insufficient data for analysis. Continue regular cognitive activities.");
            return recommendations;
        }

        // Score-based recommendations
        if (score.getOverallScore() < 40) {
            recommendations.add("Schedule immediate consultation with neurologist");
            recommendations.add("Increase frequency of cognitive exercises to daily sessions");
        } else if (score.getOverallScore() < 60) {
            recommendations.add("Consider increasing cognitive activity frequency");
            recommendations.add("Monitor performance trends closely");
        }

        // Trend-based recommendations
        long decliningTrends = trends.stream()
                .filter(t -> "DECLINING".equals(t.getTrend()))
                .count();

        if (decliningTrends >= 2) {
            recommendations.add("Multiple declining trends detected - recommend comprehensive assessment");
        }

        // Alert-based recommendations
        if (!alerts.isEmpty()) {
            long criticalAlerts = alerts.stream()
                    .filter(a -> "CRITICAL".equals(a.getSeverity()))
                    .count();

            if (criticalAlerts > 0) {
                recommendations.add("URGENT: Critical decline alerts require immediate medical attention");
            }
        }

        // General recommendations
        if (recommendations.isEmpty()) {
            recommendations.add("Continue current cognitive exercise routine");
            recommendations.add("Maintain regular assessment schedule");
        }

        return recommendations;
    }

    private TrendAnalysisResponse mapTrendToResponse(com.alzheimer.cognitiveservice.entity.TrendAnalysis entity) {
        return TrendAnalysisResponse.builder()
                .id(entity.getId())
                .patientId(entity.getPatientId())
                .gameType(entity.getGameType())
                .slope(entity.getSlope())
                .confidence(entity.getConfidence())
                .trend(entity.getTrend())
                .percentageChange(entity.getPercentageChange())
                .dataPointsUsed(entity.getDataPointsUsed())
                .periodDays(entity.getPeriodDays())
                .analyzedAt(entity.getAnalyzedAt())
                .build();
    }
}
