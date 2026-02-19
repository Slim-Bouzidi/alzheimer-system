package com.alzheimer.patientservice.mapper;

import com.alzheimer.patientservice.dto.PatientRequest;
import com.alzheimer.patientservice.dto.PatientResponse;
import com.alzheimer.patientservice.entity.Patient;

public class PatientMapper {

    public static Patient toEntity(PatientRequest request) {
        return Patient.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .age(request.getAge())
                .build();
    }

    public static PatientResponse toResponse(Patient patient) {
        return PatientResponse.builder()
                .id(patient.getId())
                .firstName(patient.getFirstName())
                .lastName(patient.getLastName())
                .age(patient.getAge())
                .build();
    }
}