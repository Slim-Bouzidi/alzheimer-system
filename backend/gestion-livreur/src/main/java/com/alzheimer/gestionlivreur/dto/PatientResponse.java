package com.alzheimer.gestionlivreur.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientResponse {
    private Long id;
    private String patientCode;
    private String firstName;
    private String lastName;
    private Integer age;
    private Double latitude;
    private Double longitude;
}
