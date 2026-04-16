package com.alzheimer.supportnetwork.repository;

import com.alzheimer.supportnetwork.domain.MissionStatus;
import com.alzheimer.supportnetwork.entity.Mission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MissionRepository extends JpaRepository<Mission, Long> {

    List<Mission> findByAssignedMemberId(Long memberId);

    long countByAssignedMemberId(Long memberId);

    List<Mission> findByPatientId(Long patientId);

    List<Mission> findByStatus(MissionStatus status);

    long countByStatus(MissionStatus status);

    @Query("SELECT COUNT(m) FROM Mission m WHERE m.stepNumber > 1")
    long countEscalatedBeyondFirstStep();
}
