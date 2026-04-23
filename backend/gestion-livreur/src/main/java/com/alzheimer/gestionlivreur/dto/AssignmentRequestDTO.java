package com.alzheimer.gestionlivreur.dto;

import lombok.*;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentRequestDTO {

    @NotBlank
    private String username;

    @NotBlank
    private String patientCode;

    @NotNull
    private LocalDate startDate;

    private LocalDate endDate;
}
