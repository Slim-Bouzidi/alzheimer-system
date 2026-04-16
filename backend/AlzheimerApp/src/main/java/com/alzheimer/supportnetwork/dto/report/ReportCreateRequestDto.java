package com.alzheimer.supportnetwork.dto.report;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportCreateRequestDto {

    @NotNull
    @Positive
    private Long missionId;

    @NotNull
    @Positive
    private Long memberId;

    @Size(max = 4000)
    private String notes;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer rating;
}
