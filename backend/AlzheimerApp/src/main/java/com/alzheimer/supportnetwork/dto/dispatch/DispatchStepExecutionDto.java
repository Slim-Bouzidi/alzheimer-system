package com.alzheimer.supportnetwork.dto.dispatch;

import com.alzheimer.supportnetwork.domain.DispatchStepStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchStepExecutionDto {

    private Long id;
    private int stepNumber;
    private int timeoutMinutes;
    private Long assigneeMemberId;
    private String assigneeName;
    private DispatchStepStatus status;
    private LocalDateTime startedAt;
}
