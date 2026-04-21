package com.alzheimer.cognitiveservice.service;

import com.alzheimer.cognitiveservice.dto.TrendAnalysisResponse;
import com.alzheimer.cognitiveservice.entity.CognitiveActivity;
import com.alzheimer.cognitiveservice.entity.TrendAnalysis;
import com.alzheimer.cognitiveservice.repository.CognitiveActivityRepository;
import com.alzheimer.cognitiveservice.repository.TrendAnalysisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Performs statistical trend analysis on cognitive activity data.
 * Uses linear regression to detect performance trends over time.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TrendAnalysisService {

    private final CognitiveActivityRepository activityRepository;
    private final TrendAnalysisRepository trendRepository;

    /**
     * Analyze trends for all game types for a patient.
     */
    public List<TrendAnalysisResponse> analyzeAll(String patientId, int periodDays) {
        List<String> gameTypes = List.of("MEMORY", "REFLEX", "VERBAL", "ATTENTION");
        List<TrendAnalysisResponse> results = new ArrayList<>();

        for (String gameType : gameTypes) {
            try {
                TrendAnalysisResponse trend = analyzeAndSave(patientId, gameType, periodDays);
                results.add(trend);
            } catch (Exception e) {
                log.warn("Failed to analyze trend for {} / {}: {}", patientId, gameType, e.getMessage());
            }
        }

        return results;
    }

    /**
     * Analyze trend for a specific game type and save the result.
     */
    @Transactional
    public TrendAnalysisResponse analyzeAndSave(String patientId, String gameType, int periodDays) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(periodDays);
        List<CognitiveActivity> activities = activityRepository
                .findByPatientIdAndGameTypeAndTimestampAfterOrderByTimestampAsc(patientId, gameType, cutoff);

        if (activities.size() < 2) {
            log.info("Insufficient data for trend analysis: {} / {} ({} points)",
                    patientId, gameType, activities.size());
            return buildInsufficientDataResponse(patientId, gameType, periodDays, activities.size());
        }

        // Perform linear regression
        double[] result = linearRegression(activities);
        double slope = result[0];
        double rSquared = result[1];

        // Determine trend category (accounting for game-type semantics)
        String trend = categorizeTrend(slope, gameType);

        // Calculate percentage change
        double percentageChange = calculatePercentageChange(activities, slope, periodDays);

        // Save to database
        TrendAnalysis entity = TrendAnalysis.builder()
                .patientId(patientId)
                .gameType(gameType)
                .slope(slope)
                .confidence(rSquared)
                .trend(trend)
                .percentageChange(percentageChange)
                .dataPointsUsed(activities.size())
                .periodDays(periodDays)
                .analyzedAt(LocalDateTime.now())
                .build();

        TrendAnalysis saved = trendRepository.save(entity);
        log.info("Trend analysis saved: {} / {} = {} (slope: {}, confidence: {})",
                patientId, gameType, trend, slope, rSquared);

        return mapToResponse(saved);
    }

    /**
     * Simple linear regression: returns [slope, r-squared]
     */
    private double[] linearRegression(List<CognitiveActivity> activities) {
        int n = activities.size();
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

        for (int i = 0; i < n; i++) {
            double x = i; // time index
            double y = activities.get(i).getScore();
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
            sumY2 += y * y;
        }

        double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        
        // Calculate R-squared
        double yMean = sumY / n;
        double ssTotal = 0, ssResidual = 0;
        for (int i = 0; i < n; i++) {
            double y = activities.get(i).getScore();
            double yPred = slope * i + (sumY - slope * sumX) / n;
            ssTotal += Math.pow(y - yMean, 2);
            ssResidual += Math.pow(y - yPred, 2);
        }
        double rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

        return new double[]{slope, Math.max(0, Math.min(1, rSquared))};
    }

    /**
     * Categorize trend based on slope and game type.
     * 
     * For REFLEX games: Lower scores are better (faster reaction time)
     *   - Negative slope = improving (scores decreasing)
     *   - Positive slope = declining (scores increasing)
     * 
     * For other games (MEMORY, VERBAL): Higher scores are better
     *   - Positive slope = improving (scores increasing)
     *   - Negative slope = declining (scores decreasing)
     */
    private String categorizeTrend(double slope, String gameType) {
        // Threshold for detecting meaningful trends
        double threshold = 0.5;
        
        if (Math.abs(slope) < threshold) {
            return "STABLE";
        }
        
        // For reflex/reaction time: invert the slope interpretation
        if ("REFLEX".equalsIgnoreCase(gameType)) {
            if (slope < -threshold) return "IMPROVING";  // Negative slope = faster times = better
            if (slope > threshold) return "DECLINING";   // Positive slope = slower times = worse
        } else {
            // For memory, verbal, and other games: higher scores are better
            if (slope > threshold) return "IMPROVING";   // Positive slope = higher scores = better
            if (slope < -threshold) return "DECLINING";  // Negative slope = lower scores = worse
        }
        
        return "STABLE";
    }

    private double calculatePercentageChange(List<CognitiveActivity> activities, double slope, int periodDays) {
        if (activities.isEmpty()) return 0.0;
        
        double firstScore = activities.get(0).getScore();
        if (firstScore == 0) return 0.0;
        
        double projectedChange = slope * activities.size();
        return (projectedChange / firstScore) * 100;
    }

    private TrendAnalysisResponse buildInsufficientDataResponse(String patientId, String gameType, 
                                                                  int periodDays, int dataPoints) {
        return TrendAnalysisResponse.builder()
                .patientId(patientId)
                .gameType(gameType)
                .slope(0.0)
                .confidence(0.0)
                .trend("INSUFFICIENT_DATA")
                .percentageChange(0.0)
                .dataPointsUsed(dataPoints)
                .periodDays(periodDays)
                .analyzedAt(LocalDateTime.now())
                .build();
    }

    private TrendAnalysisResponse mapToResponse(TrendAnalysis entity) {
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
