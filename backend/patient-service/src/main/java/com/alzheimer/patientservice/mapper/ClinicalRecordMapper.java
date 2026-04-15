package com.alzheimer.patientservice.mapper;

import com.alzheimer.patientservice.dto.ClinicalRecordRequest;
import com.alzheimer.patientservice.dto.ClinicalRecordResponse;
import com.alzheimer.patientservice.entity.ClinicalRecord;
import com.alzheimer.patientservice.entity.Patient;

public class ClinicalRecordMapper {

    public static ClinicalRecord toEntity(ClinicalRecordRequest request, Patient patient) {
        if (request == null) return null;
        return ClinicalRecord.builder()
                .patient(patient)
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
                .recordedBy(request.getRecordedBy())
                .build();
    }

    public static ClinicalRecordResponse toResponse(ClinicalRecord entity) {
        if (entity == null) return null;
        return ClinicalRecordResponse.builder()
                .id(entity.getId())
                .patientId(entity.getPatient().getId())
                .bmi(entity.getBmi())
                .systolicBP(entity.getSystolicBP())
                .diastolicBP(entity.getDiastolicBP())
                .heartRate(entity.getHeartRate())
                .bloodSugar(entity.getBloodSugar())
                .cholesterolTotal(entity.getCholesterolTotal())
                .smokingStatus(entity.getSmokingStatus())
                .alcoholConsumption(entity.getAlcoholConsumption())
                .physicalActivity(entity.getPhysicalActivity())
                .dietQuality(entity.getDietQuality())
                .sleepQuality(entity.getSleepQuality())
                .familyHistory(entity.getFamilyHistory())
                .diabetes(entity.getDiabetes())
                .hypertension(entity.getHypertension())
                .recordedBy(entity.getRecordedBy())
                .recordedAt(entity.getRecordedAt())
                .build();
    }
}
