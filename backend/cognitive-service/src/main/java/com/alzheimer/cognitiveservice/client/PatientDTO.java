package com.alzheimer.cognitiveservice.client;

import lombok.Data;

/**
 * Minimal representation of a Patient received from patient-service.
 * We only need the fields relevant to cognitive-service.
 */
@Data
public class PatientDTO {
    private Integer idPatient;
    private String firstName;
    private String lastName;
    private String status;
}
