package com.alzheimer.gestionlivreur.service.interfaces;

import com.alzheimer.gestionlivreur.dto.PatientRequest;
import com.alzheimer.gestionlivreur.dto.PatientResponse;

import java.util.List;

public interface PatientService {
    PatientResponse create(PatientRequest request);
    List<PatientResponse> findAll();
    PatientResponse findById(Long id);
    PatientResponse update(Long id, PatientRequest request);
    void delete(Long id);
}
