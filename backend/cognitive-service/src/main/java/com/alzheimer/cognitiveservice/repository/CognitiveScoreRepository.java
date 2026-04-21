package com.alzheimer.cognitiveservice.repository;

import com.alzheimer.cognitiveservice.entity.CognitiveScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CognitiveScoreRepository extends JpaRepository<CognitiveScore, Long> {

    /** Get the latest computed score for a patient */
    Optional<CognitiveScore> findTopByPatientIdOrderByComputedAtDesc(String patientId);

    /** Full score history for a patient */
    List<CognitiveScore> findByPatientIdOrderByComputedAtDesc(String patientId);

    /** Wipe all scores for a patient */
    void deleteByPatientId(String patientId);
}
