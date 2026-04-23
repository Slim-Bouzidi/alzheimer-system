package com.alzheimer.gestionlivreur.dto;

import lombok.*;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientRequest {

    @NotBlank
    private String patientCode;

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @Min(0)
    private Integer age;

    private Double latitude;

    private Double longitude;
}
