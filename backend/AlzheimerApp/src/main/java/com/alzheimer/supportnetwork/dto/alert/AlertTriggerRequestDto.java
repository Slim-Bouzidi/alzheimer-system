package com.alzheimer.supportnetwork.dto.alert;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * REST payload to run the full automated flow: engine ranking → dispatch plan → mission for the
 * primary assignee (step 1).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertTriggerRequestDto {

    @NotNull
    @Positive
    private Long patientId;

    /**
     * One of {@link com.alzheimer.supportnetwork.domain.AlertType} names, e.g. {@code CHUTE},
     * {@code FUGUE}, {@code MALAISE}, {@code COMPORTEMENT}.
     */
    @NotBlank
    @Size(max = 64)
    private String alertType;

    @Size(max = 2000)
    private String description;
}
