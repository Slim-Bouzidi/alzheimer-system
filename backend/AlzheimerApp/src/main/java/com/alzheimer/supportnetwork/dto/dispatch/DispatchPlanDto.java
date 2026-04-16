package com.alzheimer.supportnetwork.dto.dispatch;

import com.alzheimer.supportnetwork.domain.AlertType;

import java.time.LocalDateTime;
import java.util.List;

public class DispatchPlanDto {
    private Long patientId;
    private AlertType alertType;
    private LocalDateTime generatedAt;
    private List<DispatchStepDto> steps;
    /** Optional message explaining why steps might be empty (e.g. no candidates). */
    private String message;

    public DispatchPlanDto() {}

    public DispatchPlanDto(Long patientId, AlertType alertType, LocalDateTime generatedAt, List<DispatchStepDto> steps, String message) {
        this.patientId = patientId;
        this.alertType = alertType;
        this.generatedAt = generatedAt;
        this.steps = steps;
        this.message = message;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public AlertType getAlertType() { return alertType; }
    public void setAlertType(AlertType alertType) { this.alertType = alertType; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
    public List<DispatchStepDto> getSteps() { return steps; }
    public void setSteps(List<DispatchStepDto> steps) { this.steps = steps; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public static final class Builder {
        private Long patientId;
        private AlertType alertType;
        private LocalDateTime generatedAt;
        private List<DispatchStepDto> steps;
        private String message;
        public Builder patientId(Long patientId) { this.patientId = patientId; return this; }
        public Builder alertType(AlertType alertType) { this.alertType = alertType; return this; }
        public Builder generatedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; return this; }
        public Builder steps(List<DispatchStepDto> steps) { this.steps = steps; return this; }
        public Builder message(String message) { this.message = message; return this; }
        public DispatchPlanDto build() {
            return new DispatchPlanDto(patientId, alertType, generatedAt, steps, message);
        }
    }
}
