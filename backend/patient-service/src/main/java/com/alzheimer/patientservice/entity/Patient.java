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

<<<<<<< HEAD
=======
    // NEW: Foreign key to users table
    // Note: nullable = true for backward compatibility during migration
    // Will be changed to nullable = false after data migration
    @Column(name = "user_id")
    private Long userId;

    // EXISTING: Maintained for backward compatibility
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

>>>>>>> cb099be (user ui update)
    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    private Integer age;
<<<<<<< HEAD
=======

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<ClinicalRecord> clinicalRecords = new java.util.ArrayList<>();
>>>>>>> cb099be (user ui update)
}
