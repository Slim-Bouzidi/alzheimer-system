package com.alzheimer.cognitiveservice.controller;

import com.alzheimer.cognitiveservice.dto.*;
import com.alzheimer.cognitiveservice.service.AlertService;
import com.alzheimer.cognitiveservice.service.CognitiveAnalysisService;
import com.alzheimer.cognitiveservice.service.ScoringEngine;
import com.alzheimer.cognitiveservice.service.TrendAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ═══════════════════════════════════════════════════════════════
 *  COGNITIVE ANALYSIS CONTROLLER — Advanced Endpoints
 * ═══════════════════════════════════════════════════════════════
 *
 * Exposes the analysis engine via REST. These endpoints are NOT CRUD —
 * they trigger computational pipelines and return derived insights.
 */
@RestController
@RequestMapping("/api/cognitive/analysis")
@RequiredArgsConstructor
public class CognitiveAnalysisController {

    private final CognitiveAnalysisService analysisService;
    private final ScoringEngine scoringEngine;
    private final TrendAnalysisService trendService;
    private final AlertService alertService;

    // ═══════════════════════════════════════════════════
    //  FULL ANALYSIS — The main "wow" endpoint
    // ═══════════════════════════════════════════════════

    /**
     * Run a complete cognitive analysis pipeline for a patient.
     * Computes score, analyzes trends, generates alerts, and provides recommendations.
     */
    @PostMapping("/run/{patientId}")
    public ResponseEntity<PatientCognitiveReport> runFullAnalysis(@PathVariable String patientId) {
        return ResponseEntity.ok(analysisService.runFullAnalysis(patientId));
    }

    /**
     * Get the latest report without re-running analysis.
     */
    @GetMapping("/report/{patientId}")
    public ResponseEntity<PatientCognitiveReport> getReport(@PathVariable String patientId) {
        return ResponseEntity.ok(analysisService.getLatestReport(patientId));
    }

    /**
     * Clear all analysis data for a patient.
     * Use this to start a fresh assessment period.
     */
    @DeleteMapping("/reset/{patientId}")
    public ResponseEntity<Void> resetAnalysis(@PathVariable String patientId) {
        analysisService.resetAnalysis(patientId);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════════════════
    //  COGNITIVE SCORE — Individual scoring endpoint
    // ═══════════════════════════════════════════════════

    /**
     * Compute a fresh cognitive score for a patient.
     */
    @PostMapping("/score/{patientId}")
    public ResponseEntity<CognitiveScoreResponse> computeScore(
            @PathVariable String patientId,
            @RequestParam(defaultValue = "30") int windowDays) {
        return ResponseEntity.ok(scoringEngine.computeAndSave(patientId, windowDays));
    }

    /**
     * Get the latest computed score (no recompute).
     */
    @GetMapping("/score/{patientId}")
    public ResponseEntity<CognitiveScoreResponse> getScore(@PathVariable String patientId) {
        return scoringEngine.getLatestScore(patientId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    // ═══════════════════════════════════════════════════
    //  TREND ANALYSIS — Statistical trend endpoints
    // ═══════════════════════════════════════════════════

    /**
     * Run trend analysis for all game types.
     */
    @PostMapping("/trends/{patientId}")
    public ResponseEntity<List<TrendAnalysisResponse>> analyzeTrends(
            @PathVariable String patientId,
            @RequestParam(defaultValue = "14") int periodDays) {
        return ResponseEntity.ok(trendService.analyzeAll(patientId, periodDays));
    }

    /**
     * Run trend analysis for a specific game type.
     */
    @PostMapping("/trends/{patientId}/{gameType}")
    public ResponseEntity<TrendAnalysisResponse> analyzeTrend(
            @PathVariable String patientId,
            @PathVariable String gameType,
            @RequestParam(defaultValue = "14") int periodDays) {
        return ResponseEntity.ok(trendService.analyzeAndSave(patientId, gameType, periodDays));
    }

    // ═══════════════════════════════════════════════════
    //  DECLINE ALERTS — Automated alert endpoints
    // ═══════════════════════════════════════════════════

    /**
     * Get all alerts for a patient.
     */
    @GetMapping("/alerts/{patientId}")
    public ResponseEntity<List<DeclineAlertResponse>> getAlerts(@PathVariable String patientId) {
        return ResponseEntity.ok(alertService.getAlerts(patientId));
    }

    /**
     * Get only active (unacknowledged) alerts.
     */
    @GetMapping("/alerts/{patientId}/active")
    public ResponseEntity<List<DeclineAlertResponse>> getActiveAlerts(@PathVariable String patientId) {
        return ResponseEntity.ok(alertService.getActiveAlerts(patientId));
    }

    /**
     * Acknowledge (dismiss) an alert — called by a doctor.
     */
    @PatchMapping("/alerts/{alertId}/acknowledge")
    public ResponseEntity<DeclineAlertResponse> acknowledgeAlert(@PathVariable Long alertId) {
        return ResponseEntity.ok(alertService.acknowledgeAlert(alertId));
    }
}
