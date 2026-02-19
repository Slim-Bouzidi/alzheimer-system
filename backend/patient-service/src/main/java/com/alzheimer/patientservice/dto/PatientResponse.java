package com.alzheimer.patientservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PatientResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private Integer age;
}