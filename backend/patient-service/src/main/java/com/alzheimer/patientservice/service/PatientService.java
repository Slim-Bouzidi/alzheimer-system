package com.alzheimer.patientservice.service;

import com.alzheimer.patientservice.dto.PatientRequest;
import com.alzheimer.patientservice.dto.PatientResponse;

import java.util.List;

public interface PatientService {

    PatientResponse create(PatientRequest request);

    List<PatientResponse> findAll();

    PatientResponse findById(Long id);

<<<<<<< HEAD
=======
    PatientResponse findByKeycloakId(String keycloakId);
    
    // NEW: Query by user ID
    PatientResponse findByUserId(Long userId);

    PatientResponse saveOrUpdateByKeycloakId(String keycloakId, PatientRequest request);

>>>>>>> cb099be (user ui update)
    PatientResponse update(Long id, PatientRequest request);

    void delete(Long id);
}