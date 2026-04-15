package com.alzheimer.patientservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalRecordResponse {
    private Long id;
    private Long patientId;
    private Double bmi;
    private Integer systolicBP;
    private Integer diastolicBP;
    private Integer heartRate;
    private Double bloodSugar;
    private Double cholesterolTotal;
    private String smokingStatus;
    private String alcoholConsumption;
    private Integer physicalActivity;
    private Integer dietQuality;
    private Integer sleepQuality;
    private Boolean familyHistory;
    private Boolean diabetes;
    private Boolean hypertension;
    private String recordedBy;
    private LocalDateTime recordedAt;
}
