package com.alzheimer.cognitiveservice.repository;

import com.alzheimer.cognitiveservice.entity.CognitiveActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CognitiveActivityRepository extends JpaRepository<CognitiveActivity, Long> {
    List<CognitiveActivity> findByPatientId(String patientId);

    /** Activities for a patient after a given date — used by the analysis engine */
    List<CognitiveActivity> findByPatientIdAndTimestampAfterOrderByTimestampAsc(
            String patientId, LocalDateTime after);

    /** Activities for a patient + specific game type after a given date */
    List<CognitiveActivity> findByPatientIdAndGameTypeAndTimestampAfterOrderByTimestampAsc(
            String patientId, String gameType, LocalDateTime after);

    /** Distinct game types a patient has played */
    @Query("SELECT DISTINCT a.gameType FROM CognitiveActivity a WHERE a.patientId = :patientId")
    List<String> findDistinctGameTypesByPatientId(String patientId);

    /** Wipe all activities for a patient */
    void deleteByPatientId(String patientId);
}
