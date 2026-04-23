package com.alzheimer.gestionlivreur.dto;

import com.alzheimer.gestionlivreur.entity.DeliveryStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryTaskResponseDTO {
    private Long id;
    private String patientCode;
    private String patientFullName;
    private LocalDate deliveryDate;
    private LocalTime plannedTime;
    private DeliveryStatus status;
    private String assignedStaffUsername;
    private String assignedStaffFullName;
    private LocalDateTime confirmedAt;
    private LocalDateTime deliveredAt;
    private String notes;
}
