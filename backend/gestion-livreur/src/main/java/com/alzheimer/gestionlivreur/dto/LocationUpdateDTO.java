package com.alzheimer.gestionlivreur.dto;

import lombok.*;

import javax.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationUpdateDTO {

    @NotNull
    private Long staffId;

    @NotNull
    private Long routeId;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;
}
