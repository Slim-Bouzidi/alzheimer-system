package com.alzheimer.gestionlivreur.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationResponseDTO {
    private Long id;
    private Long staffId;
    private Long routeId;
    private Double latitude;
    private Double longitude;
    private LocalDateTime timestamp;
}
