package com.alzheimer.supportnetwork.dto.engine;

import java.time.LocalDateTime;
import java.util.List;

public class BestIntervenantsResponseDto {
    private Long patientId;
    private LocalDateTime generatedAt;
    private List<RankedIntervenantDto> items;

    public BestIntervenantsResponseDto() {}

    public BestIntervenantsResponseDto(Long patientId, LocalDateTime generatedAt, List<RankedIntervenantDto> items) {
        this.patientId = patientId;
        this.generatedAt = generatedAt;
        this.items = items;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
    public List<RankedIntervenantDto> getItems() { return items; }
    public void setItems(List<RankedIntervenantDto> items) { this.items = items; }

    public static final class Builder {
        private Long patientId;
        private LocalDateTime generatedAt;
        private List<RankedIntervenantDto> items;
        public Builder patientId(Long patientId) { this.patientId = patientId; return this; }
        public Builder generatedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; return this; }
        public Builder items(List<RankedIntervenantDto> items) { this.items = items; return this; }
        public BestIntervenantsResponseDto build() {
            return new BestIntervenantsResponseDto(patientId, generatedAt, items);
        }
    }
}
