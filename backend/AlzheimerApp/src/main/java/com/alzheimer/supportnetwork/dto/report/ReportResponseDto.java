package com.alzheimer.supportnetwork.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportResponseDto {

    private Long id;
    private Long missionId;
    private Long memberId;
    private String notes;
    private int rating;
    private LocalDateTime createdAt;
}
