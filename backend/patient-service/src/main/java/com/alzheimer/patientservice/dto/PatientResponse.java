package com.alzheimer.patientservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PatientResponse {

    private Long id;
    private String keycloakId;

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
    private String firstName;
    private String lastName;
    private Integer age;
}