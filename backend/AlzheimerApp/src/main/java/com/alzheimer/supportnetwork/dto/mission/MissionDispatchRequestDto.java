package com.alzheimer.supportnetwork.dto.mission;

import jakarta.validation.constraints.NotBlank;
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
public class MissionDispatchRequestDto {

    @NotNull
    @Positive
    private Long patientId;

    /** Must match a {@link com.alzheimer.supportnetwork.domain.AlertType} name (e.g. {@code CHUTE}). */
    @NotBlank
    @Size(max = 64)
    private String alertType;

    @NotNull
    @Positive
    private Long assignedMemberId;

    @NotBlank
    @Size(max = 255)
    private String title;

    @Size(max = 2000)
    private String description;
}
