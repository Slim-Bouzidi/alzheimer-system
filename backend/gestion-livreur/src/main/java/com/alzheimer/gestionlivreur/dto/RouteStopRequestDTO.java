package com.alzheimer.gestionlivreur.dto;

import lombok.*;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteStopRequestDTO {

    @NotNull
    private Long patientId;

    @NotNull
    @Min(1)
    private Integer stopOrder;

    private String notes;
}
