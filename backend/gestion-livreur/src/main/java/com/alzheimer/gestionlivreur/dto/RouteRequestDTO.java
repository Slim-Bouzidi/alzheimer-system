package com.alzheimer.gestionlivreur.dto;

import lombok.*;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteRequestDTO {

    @NotNull
    private LocalDate routeDate;

    @NotNull
    private Long mealSlotId;

    @NotNull
    private Long staffId;

    @NotBlank
    private String label;
}
