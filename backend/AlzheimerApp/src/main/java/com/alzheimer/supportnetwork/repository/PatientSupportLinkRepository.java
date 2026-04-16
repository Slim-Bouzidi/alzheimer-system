package com.alzheimer.supportnetwork.repository;

import com.alzheimer.supportnetwork.entity.PatientSupportLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatientSupportLinkRepository extends JpaRepository<PatientSupportLink, Long> {
    List<PatientSupportLink> findByPatientId(Long patientId);

    /** Find all links for a patient by patient id (property path: patient.id). */
    List<PatientSupportLink> findByPatient_Id(Long patientId);

    boolean existsByPatient_IdAndMember_Id(Long patientId, Long memberId);

    boolean existsByPatient_IdAndMember_IdAndIdNot(Long patientId, Long memberId, Long linkId);

    long countByMember_Id(Long memberId);

    void deleteByMember_Id(Long memberId);
}
