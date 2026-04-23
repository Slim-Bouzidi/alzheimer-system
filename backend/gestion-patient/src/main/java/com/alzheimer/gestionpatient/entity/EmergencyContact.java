package com.alzheimer.gestionpatient.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idContact;

    private String fullName;
    private String relationship;
    private String phone;
    private String email;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    @JsonBackReference("patient-emergency-contacts")
    private Patient patient;
}
