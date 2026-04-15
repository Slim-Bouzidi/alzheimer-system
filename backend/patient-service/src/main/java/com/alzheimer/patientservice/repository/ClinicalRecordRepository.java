package com.alzheimer.patientservice.repository;

import com.alzheimer.patientservice.entity.ClinicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClinicalRecordRepository extends JpaRepository<ClinicalRecord, Long> {
    List<ClinicalRecord> findByPatientIdOrderByRecordedAtDesc(Long patientId);
    List<ClinicalRecord> findByPatientKeycloakIdOrderByRecordedAtDesc(String keycloakId);
}
