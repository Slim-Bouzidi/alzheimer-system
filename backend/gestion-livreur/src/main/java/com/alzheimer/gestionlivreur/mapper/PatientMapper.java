package com.alzheimer.gestionlivreur.mapper;

import com.alzheimer.gestionlivreur.dto.PatientRequest;
import com.alzheimer.gestionlivreur.dto.PatientResponse;
import com.alzheimer.gestionlivreur.entity.Patient;
import org.springframework.stereotype.Component;

@Component
public class PatientMapper {

    public Patient toEntity(PatientRequest request) {
        return Patient.builder()
                .patientCode(request.getPatientCode())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .age(request.getAge())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build();
    }

    public PatientResponse toResponse(Patient patient) {
        return PatientResponse.builder()
                .id(patient.getId())
                .patientCode(patient.getPatientCode())
                .firstName(patient.getFirstName())
                .lastName(patient.getLastName())
                .age(patient.getAge())
                .latitude(patient.getLatitude())
                .longitude(patient.getLongitude())
                .build();
    }
}
