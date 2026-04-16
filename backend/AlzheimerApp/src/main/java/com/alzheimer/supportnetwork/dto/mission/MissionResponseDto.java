package com.alzheimer.supportnetwork.dto.mission;

import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.domain.MissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MissionResponseDto {

    private Long id;
    private Long patientId;
    private Long assignedMemberId;
    private AlertType alertType;
    private String title;
    private String description;
    private MissionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime completedAt;

    private int stepNumber;
    private LocalDateTime lastAssignedAt;
}
