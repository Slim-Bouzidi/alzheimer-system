package com.alzheimer.supportnetwork.dto.dispatch;

import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.domain.DispatchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchHistoryDetailDto {

    private Long id;
    private Long patientId;
    private AlertType alertType;
    private LocalDateTime generatedAt;
    private DispatchStatus status;
    private Long missionId;

    @Builder.Default
    private List<DispatchStepExecutionDto> steps = new ArrayList<>();
}
