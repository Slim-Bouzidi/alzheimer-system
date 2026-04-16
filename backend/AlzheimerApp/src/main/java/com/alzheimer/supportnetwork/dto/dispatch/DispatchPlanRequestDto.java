package com.alzheimer.supportnetwork.dto.dispatch;

import com.alzheimer.supportnetwork.domain.AlertType;

import java.time.LocalDateTime;

public class DispatchPlanRequestDto {
    private Long patientId;
    private AlertType alertType;
    private LocalDateTime now;

    public DispatchPlanRequestDto() {}

    public DispatchPlanRequestDto(Long patientId, AlertType alertType, LocalDateTime now) {
        this.patientId = patientId;
        this.alertType = alertType;
        this.now = now;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public AlertType getAlertType() { return alertType; }
    public void setAlertType(AlertType alertType) { this.alertType = alertType; }
    public LocalDateTime getNow() { return now; }
    public void setNow(LocalDateTime now) { this.now = now; }

    public static final class Builder {
        private Long patientId;
        private AlertType alertType;
        private LocalDateTime now;
        public Builder patientId(Long patientId) { this.patientId = patientId; return this; }
        public Builder alertType(AlertType alertType) { this.alertType = alertType; return this; }
        public Builder now(LocalDateTime now) { this.now = now; return this; }
        public DispatchPlanRequestDto build() {
            return new DispatchPlanRequestDto(patientId, alertType, now);
        }
    }
}
