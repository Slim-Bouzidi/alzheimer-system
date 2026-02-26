package com.alzheimer.patientservice.dto;

import lombok.Data;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Data
public class PatientRequest {

    private String keycloakId;
    
    @DecimalMin(value = "0.0", message = "BMI cannot be negative")
    private Double bmi;
    
    @Min(value = 0, message = "Systolic BP cannot be negative")
    private Integer systolicBP;
    
    @Min(value = 0, message = "Diastolic BP cannot be negative")
    private Integer diastolicBP;
    
    @Min(value = 0, message = "Heart rate cannot be negative")
    private Integer heartRate;
    
    @DecimalMin(value = "0.0", message = "Blood sugar cannot be negative")
    private Double bloodSugar;
    
    @DecimalMin(value = "0.0", message = "Cholesterol cannot be negative")
    private Double cholesterolTotal;
    
    private String smokingStatus;
    private String alcoholConsumption;
    
    @Min(value = 0, message = "Physical activity must be at least 0")
    private Integer physicalActivity;
    
    @Min(value = 0, message = "Diet quality must be at least 0")
    private Integer dietQuality;
    
    @Min(value = 0, message = "Sleep quality must be at least 0")
    private Integer sleepQuality;
    
    private Boolean familyHistory;
    private Boolean diabetes;
    private Boolean hypertension;
    
    private String firstName;
    private String lastName;
    
    @Min(value = 0, message = "Age cannot be negative")
    private Integer age;
}
