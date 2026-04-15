package com.alzheimer.patientservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalRecordRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;
    
    @Min(value = 0, message = "BMI cannot be negative")
    private Double bmi;
    
    @Min(value = 0, message = "Systolic BP cannot be negative")
    private Integer systolicBP;
    
    @Min(value = 0, message = "Diastolic BP cannot be negative")
    private Integer diastolicBP;
    
    @Min(value = 0, message = "Heart rate cannot be negative")
    private Integer heartRate;
    
    @Min(value = 0, message = "Blood sugar cannot be negative")
    private Double bloodSugar;
    
    @Min(value = 0, message = "Cholesterol cannot be negative")
    private Double cholesterolTotal;
    
    private String smokingStatus;
    private String alcoholConsumption;
    
    @Min(value = 0, message = "Physical activity must be between 0 and 10")
    private Integer physicalActivity;
    
    @Min(value = 0, message = "Diet quality must be between 0 and 10")
    private Integer dietQuality;
    
    @Min(value = 0, message = "Sleep quality must be between 0 and 10")
    private Integer sleepQuality;
    
    private Boolean familyHistory;
    private Boolean diabetes;
    private Boolean hypertension;
    
    private String recordedBy;
}
