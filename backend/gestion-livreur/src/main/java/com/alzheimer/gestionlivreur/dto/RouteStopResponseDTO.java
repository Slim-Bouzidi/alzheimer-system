package com.alzheimer.gestionlivreur.dto;

import com.alzheimer.gestionlivreur.entity.StopStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteStopResponseDTO {
    private Long id;
    private Long routeId;
    private Long patientId;
    private String patientCode;
    private String patientFullName;
    private Integer stopOrder;
    private StopStatus status;
    private LocalDateTime deliveredAt;
    private String notes;
    private Double latitude;
    private Double longitude;
}
