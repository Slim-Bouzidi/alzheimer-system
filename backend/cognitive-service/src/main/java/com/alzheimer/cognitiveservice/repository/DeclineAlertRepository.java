package com.alzheimer.cognitiveservice.repository;

import com.alzheimer.cognitiveservice.entity.DeclineAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeclineAlertRepository extends JpaRepository<DeclineAlert, Long> {

    /** All alerts for a patient, newest first */
    List<DeclineAlert> findByPatientIdOrderByCreatedAtDesc(String patientId);

    /** Unacknowledged alerts for a patient */
    List<DeclineAlert> findByPatientIdAndAcknowledgedFalseOrderByCreatedAtDesc(String patientId);

    /** Count of active (unacknowledged) alerts */
    long countByPatientIdAndAcknowledgedFalse(String patientId);

    /** Wipe all alerts for a patient */
    void deleteByPatientId(String patientId);
}
