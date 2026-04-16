package org.example.alzheimerapp.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.io.Serializable;
import java.util.Date;

@Entity
@Table(name = "treatment")
public class Treatment implements Serializable {

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
    @JoinColumn(name = "patient_id_patient")
    @JsonBackReference
    private Patient patient;

    /* ================= CONSTRUCTOR ================= */

    public Treatment() {
    }

    public Treatment(Integer idTreatment, String treatmentName, String dosage, String frequency,
                     Date startDate, Date endDate, String status, Patient patient) {
        this.idTreatment = idTreatment;
        this.treatmentName = treatmentName;
        this.dosage = dosage;
        this.frequency = frequency;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.patient = patient;
    }

    /* ================= GETTERS & SETTERS ================= */

    public Integer getIdTreatment() {
        return idTreatment;
    }

    public void setIdTreatment(Integer idTreatment) {
        this.idTreatment = idTreatment;
    }

    public String getTreatmentName() {
        return treatmentName;
    }

    public void setTreatmentName(String treatmentName) {
        this.treatmentName = treatmentName;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }
}