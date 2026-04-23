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
public class Treatment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idTreatment;

    private String treatmentName;
    private String dosage;
    private String frequency;

    @Temporal(TemporalType.DATE)
    private Date startDate;

    @Temporal(TemporalType.DATE)
    private Date endDate;

    private String status;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    @JsonBackReference("patient-treatments")
    private Patient patient;
}
