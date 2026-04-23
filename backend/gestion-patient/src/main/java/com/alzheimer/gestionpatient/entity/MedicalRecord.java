package com.alzheimer.gestionpatient.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.util.Date;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idRecord;

    private String diagnosis;
    private String diseaseStage;
    private String medicalHistory;
    private String allergies;

    @Temporal(TemporalType.DATE)
    private Date recordDate;

    @Temporal(TemporalType.TIMESTAMP)
    private Date lastUpdate;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    @JsonBackReference("patient-medical-records")
    private Patient patient;
}
