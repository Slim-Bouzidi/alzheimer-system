package com.alzheimer.supportnetwork.dto.engine;

import com.alzheimer.supportnetwork.domain.AlertType;

import java.time.LocalDateTime;

public class BestIntervenantsRequestDto {
    private Long patientId;
    private LocalDateTime now;
    /** When set, skill-based score boosts apply for this alert context (dispatch / engine). */
    private AlertType alertType;

    public BestIntervenantsRequestDto() {}

    public BestIntervenantsRequestDto(Long patientId, LocalDateTime now, AlertType alertType) {
        this.patientId = patientId;
        this.now = now;
        this.alertType = alertType;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public LocalDateTime getNow() { return now; }
    public void setNow(LocalDateTime now) { this.now = now; }
    public AlertType getAlertType() { return alertType; }
    public void setAlertType(AlertType alertType) { this.alertType = alertType; }

    public static final class Builder {
        private Long patientId;
        private LocalDateTime now;
        private AlertType alertType;
        public Builder patientId(Long patientId) { this.patientId = patientId; return this; }
        public Builder now(LocalDateTime now) { this.now = now; return this; }
        public Builder alertType(AlertType alertType) { this.alertType = alertType; return this; }
        public BestIntervenantsRequestDto build() {
            return new BestIntervenantsRequestDto(patientId, now, alertType);
        }
    }
}
