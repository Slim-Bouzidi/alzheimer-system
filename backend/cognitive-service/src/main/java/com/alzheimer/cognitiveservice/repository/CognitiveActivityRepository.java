package com.alzheimer.cognitiveservice.repository;

import com.alzheimer.cognitiveservice.entity.CognitiveActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CognitiveActivityRepository extends JpaRepository<CognitiveActivity, Long> {
    List<CognitiveActivity> findByPatientId(String patientId);
}
