package com.alzheimer.supportnetwork.repository;

import com.alzheimer.supportnetwork.entity.InterventionReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterventionReportRepository extends JpaRepository<InterventionReport, Long> {

    List<InterventionReport> findByMissionIdOrderByCreatedAtDesc(Long missionId);

    boolean existsByMissionId(Long missionId);

    long countByMemberId(Long memberId);
}
