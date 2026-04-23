package com.alzheimer.gestionpatient.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TreatmentDTO {
    private String treatmentName;
    private String dosage;
    private String frequency;
    private String startDate;
    private String endDate;
    private String status;
    private Integer patientId;
}
