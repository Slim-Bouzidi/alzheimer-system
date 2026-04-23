package com.alzheimer.gestionlivreur.dto;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentResponseDTO {
    private Long id;
    private String username;
    private String staffFullName;
    private String patientCode;
    private String patientFullName;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean active;
}
