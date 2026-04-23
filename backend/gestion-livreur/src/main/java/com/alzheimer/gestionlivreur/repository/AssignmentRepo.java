package com.alzheimer.gestionlivreur.repository;

import com.alzheimer.gestionlivreur.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepo extends JpaRepository<Assignment, Long> {
    List<Assignment> findByPatient_Id(Long patientId);
    List<Assignment> findByStaff_Id(Long staffId);
    List<Assignment> findByStaff_IdAndActiveTrue(Long staffId);
    List<Assignment> findByPatient_IdAndActiveTrue(Long patientId);
    boolean existsByStaff_IdAndPatient_IdAndActiveTrue(Long staffId, Long patientId);

    @Modifying
    void deleteByPatientId(Long patientId);
}
