package com.alzheimer.patientservice.entity;

import javax.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "clinical_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    // Vital Signs & Physical Metrics
    private Double bmi;
    private Integer systolicBP;
    private Integer diastolicBP;
    private Integer heartRate;
    private Double bloodSugar;
    private Double cholesterolTotal;

    // Lifestyle Factors
    private String smokingStatus;
    private String alcoholConsumption;
    
    // Quality Scales (0-10)
    private Integer physicalActivity;
    private Integer dietQuality;
    private Integer sleepQuality;

    // Medical History Flags
    private Boolean familyHistory;
    private Boolean diabetes;
    private Boolean hypertension;

    // Metadata
    private LocalDateTime recordedAt;
    private String recordedBy;

    @PrePersist
    protected void onCreate() {
        recordedAt = LocalDateTime.now();
    }
}
