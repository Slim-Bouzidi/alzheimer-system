package com.alzheimer.patientservice.dto;

import lombok.Data;

@Data
public class PatientRequest {

    private String firstName;
    private String lastName;
    private Integer age;
}
