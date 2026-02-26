package com.alzheimer.patientservice.service;

import com.alzheimer.patientservice.dto.ClinicalRecordRequest;
import com.alzheimer.patientservice.dto.ClinicalRecordResponse;
import java.util.List;

public interface ClinicalRecordService {
    ClinicalRecordResponse create(ClinicalRecordRequest request);
    List<ClinicalRecordResponse> findByPatientId(Long patientId);
    List<ClinicalRecordResponse> findMyRecords(String keycloakId);
    ClinicalRecordResponse update(Long id, ClinicalRecordRequest request);
    void delete(Long id);
}
