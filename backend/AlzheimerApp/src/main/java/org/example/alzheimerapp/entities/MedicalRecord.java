package org.example.alzheimerapp.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.io.Serializable;
import java.util.Date;

@Entity
@Table(name = "medical_record")
public class MedicalRecord implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_record")
    private Integer idRecord;

    @Column(name = "diagnosis")
    private String diagnosis;

    @Column(name = "disease_stage")
    private String diseaseStage;

    @Column(name = "medical_history")
    private String medicalHistory;

    @Column(name = "allergies")
    private String allergies;

    @Temporal(TemporalType.DATE)
    @Column(name = "record_date")
    private Date recordDate;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "last_update")
    private Date lastUpdate;

    @ManyToOne
    @JoinColumn(name = "patient_id_patient")
    @JsonBackReference
    private Patient patient;

    /* ================= CONSTRUCTOR ================= */

    public MedicalRecord() {
    }

    public MedicalRecord(Integer idRecord, String diagnosis, String diseaseStage, String medicalHistory, 
                         String allergies, Date recordDate, Date lastUpdate, Patient patient) {
        this.idRecord = idRecord;
        this.diagnosis = diagnosis;
        this.diseaseStage = diseaseStage;
        this.medicalHistory = medicalHistory;
        this.allergies = allergies;
        this.recordDate = recordDate;
        this.lastUpdate = lastUpdate;
        this.patient = patient;
    }

    /* ================= GETTERS & SETTERS ================= */

    public Integer getIdRecord() {
        return idRecord;
    }

    public void setIdRecord(Integer idRecord) {
        this.idRecord = idRecord;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getDiseaseStage() {
        return diseaseStage;
    }

    public void setDiseaseStage(String diseaseStage) {
        this.diseaseStage = diseaseStage;
    }

    public String getMedicalHistory() {
        return medicalHistory;
    }

    public void setMedicalHistory(String medicalHistory) {
        this.medicalHistory = medicalHistory;
    }

    public String getAllergies() {
        return allergies;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }

    public Date getRecordDate() {
        return recordDate;
    }

    public void setRecordDate(Date recordDate) {
        this.recordDate = recordDate;
    }

    public Date getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(Date lastUpdate) {
        this.lastUpdate = lastUpdate;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }
}
