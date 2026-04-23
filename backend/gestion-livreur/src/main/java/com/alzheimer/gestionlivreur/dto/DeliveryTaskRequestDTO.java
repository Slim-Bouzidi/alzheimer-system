package com.alzheimer.gestionlivreur.dto;

import lombok.*;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryTaskRequestDTO {

    @NotBlank
    private String patientCode;

    @NotNull
    private LocalDate deliveryDate;

    @NotNull
    private LocalTime plannedTime;

    private String assignedStaffUsername;

    private String notes;
}
