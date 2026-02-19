package com.alzheimer.patientservice.service;

import com.alzheimer.patientservice.dto.PatientRequest;
import com.alzheimer.patientservice.dto.PatientResponse;

import java.util.List;

public interface PatientService {

    PatientResponse create(PatientRequest request);

    List<PatientResponse> findAll();

    PatientResponse findById(Long id);

    void delete(Long id);
}