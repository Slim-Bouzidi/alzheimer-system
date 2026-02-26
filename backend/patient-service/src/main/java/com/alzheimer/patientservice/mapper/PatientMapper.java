package com.alzheimer.patientservice.mapper;

import com.alzheimer.patientservice.dto.PatientRequest;
import com.alzheimer.patientservice.dto.PatientResponse;
import com.alzheimer.patientservice.entity.Patient;

public class PatientMapper {

    public static Patient toEntity(PatientRequest request) {
        return Patient.builder()
                .keycloakId(request.getKeycloakId())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .age(request.getAge())
                .bmi(request.getBmi())
                .systolicBP(request.getSystolicBP())
                .diastolicBP(request.getDiastolicBP())
                .heartRate(request.getHeartRate())
                .bloodSugar(request.getBloodSugar())
                .cholesterolTotal(request.getCholesterolTotal())
                .smokingStatus(request.getSmokingStatus())
                .alcoholConsumption(request.getAlcoholConsumption())
                .physicalActivity(request.getPhysicalActivity())
                .dietQuality(request.getDietQuality())
                .sleepQuality(request.getSleepQuality())
                .familyHistory(request.getFamilyHistory())
                .diabetes(request.getDiabetes())
                .hypertension(request.getHypertension())
                .build();
    }

    public static PatientResponse toResponse(Patient patient) {
        return PatientResponse.builder()
                .id(patient.getId())
                .keycloakId(patient.getKeycloakId())
                .firstName(patient.getFirstName())
                .lastName(patient.getLastName())
                .age(patient.getAge())
                .bmi(patient.getBmi())
                .systolicBP(patient.getSystolicBP())
                .diastolicBP(patient.getDiastolicBP())
                .heartRate(patient.getHeartRate())
                .bloodSugar(patient.getBloodSugar())
                .cholesterolTotal(patient.getCholesterolTotal())
                .smokingStatus(patient.getSmokingStatus())
                .alcoholConsumption(patient.getAlcoholConsumption())
                .physicalActivity(patient.getPhysicalActivity())
                .dietQuality(patient.getDietQuality())
                .sleepQuality(patient.getSleepQuality())
                .familyHistory(patient.getFamilyHistory())
                .diabetes(patient.getDiabetes())
                .hypertension(patient.getHypertension())
                .build();
    }
}