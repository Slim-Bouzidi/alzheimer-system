package org.example.alzheimerapp.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.io.Serializable;

@Entity
@Table(name = "emergency_contact")
public class EmergencyContact implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idContact;

    private String fullName;
    private String relationship;
    private String phone;
    private String email;

    @ManyToOne
    @JoinColumn(name = "patient_id_patient")
    @JsonBackReference
    private Patient patient;

    public EmergencyContact() {
    }

    public EmergencyContact(Integer idContact, String fullName, String relationship, String phone, String email, Patient patient) {
        this.idContact = idContact;
        this.fullName = fullName;
        this.relationship = relationship;
        this.phone = phone;
        this.email = email;
        this.patient = patient;
    }

    public Integer getIdContact() {
        return idContact;
    }

    public void setIdContact(Integer idContact) {
        this.idContact = idContact;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRelationship() {
        return relationship;
    }

    public void setRelationship(String relationship) {
        this.relationship = relationship;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }
}
