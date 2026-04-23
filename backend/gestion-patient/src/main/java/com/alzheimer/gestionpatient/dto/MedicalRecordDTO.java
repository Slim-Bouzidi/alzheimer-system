package com.alzheimer.gestionpatient.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordDTO {
    private String diagnosis;
    private String diseaseStage;
    private String medicalHistory;
    private String allergies;
    private String recordDate;
    private Integer patientId;
}
