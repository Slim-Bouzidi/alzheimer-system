package com.alzheimer.supportnetwork.dto.dispatch;

import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.domain.DispatchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchHistoryItemDto {

    private Long id;
    private Long patientId;
    private AlertType alertType;
    private LocalDateTime generatedAt;
    private DispatchStatus status;
    private Long missionId;
}
