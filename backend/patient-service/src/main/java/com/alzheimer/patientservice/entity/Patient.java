package com.alzheimer.patientservice.entity;

import javax.persistence.*;
import lombok.*;

@Entity
@Table(name = "patients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String keycloakId;

    // Clinical Metrics (Latest)
    private Double bmi;
    private Integer systolicBP;
    private Integer diastolicBP;
    private Integer heartRate;
    private Double bloodSugar;
    private Double cholesterolTotal;
    private String smokingStatus;
    private String alcoholConsumption;
    private Integer physicalActivity;
    private Integer dietQuality;
    private Integer sleepQuality;
    private Boolean familyHistory;
    private Boolean diabetes;
    private Boolean hypertension;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    private Integer age;

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<ClinicalRecord> clinicalRecords = new java.util.ArrayList<>();
}
