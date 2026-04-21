package com.alzheimer.cognitiveservice.repository;

import com.alzheimer.cognitiveservice.entity.TrendAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrendAnalysisRepository extends JpaRepository<TrendAnalysis, Long> {

    /** Latest trend for a specific game type */
    Optional<TrendAnalysis> findTopByPatientIdAndGameTypeOrderByAnalyzedAtDesc(String patientId, String gameType);

    /** All latest trends for a patient (all game types) */
    List<TrendAnalysis> findByPatientIdOrderByAnalyzedAtDesc(String patientId);

    /** Wipe all trends for a patient */
    void deleteByPatientId(String patientId);
}
