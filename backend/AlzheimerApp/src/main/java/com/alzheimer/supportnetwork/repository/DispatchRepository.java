package com.alzheimer.supportnetwork.repository;

import com.alzheimer.supportnetwork.domain.DispatchStatus;
import com.alzheimer.supportnetwork.entity.Dispatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DispatchRepository extends JpaRepository<Dispatch, Long> {

    List<Dispatch> findByPatientIdOrderByGeneratedAtDesc(Long patientId);

    List<Dispatch> findByStatusAndMissionIdIsNotNull(DispatchStatus status);

    Optional<Dispatch> findByMissionId(Long missionId);
}
