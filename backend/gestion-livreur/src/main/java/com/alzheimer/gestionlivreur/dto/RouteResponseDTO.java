package com.alzheimer.gestionlivreur.dto;

import com.alzheimer.gestionlivreur.entity.RouteStatus;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteResponseDTO {
    private Long id;
    private LocalDate routeDate;
    private Long mealSlotId;
    private Long staffId;
    private RouteStatus status;
    private Boolean active;
    private String label;
    private List<RouteStopResponseDTO> stops;
}
