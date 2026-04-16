package com.assistance.assistanceQuotidienne2.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "patients")
public class Patient {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nom_complet", nullable = false)
    private String nomComplet;
    
    @Column(name = "date_naissance")
    private LocalDate dateNaissance;
    
    @Column(name = "adresse")
    private String adresse;
    
    @Column(name = "numero_de_telephone")
    private String numeroDeTelephone;
    
    @Column(name = "antecedents", columnDefinition = "TEXT")
    private String antecedents;
    
    @Column(name = "allergies", columnDefinition = "TEXT")
    private String allergies;
    
    @Column(name = "nb_interventions_mois")
    private Integer nbInterventionsMois;
    
    @Column(name = "derniere_visite")
    private LocalDate derniereVisite;
    
    @Column(name = "actif")
    private Boolean actif = true;
    
    // Constructeurs
    public Patient() {}
    
    public Patient(String nomComplet) {
        this.nomComplet = nomComplet;
    }
    
    // Getters et Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getNomComplet() {
        return nomComplet;
    }
    
    public void setNomComplet(String nomComplet) {
        this.nomComplet = nomComplet;
    }
    
    public LocalDate getDateNaissance() {
        return dateNaissance;
    }
    
    public void setDateNaissance(LocalDate dateNaissance) {
        this.dateNaissance = dateNaissance;
    }
    
    public String getAdresse() {
        return adresse;
    }
    
    public void setAdresse(String adresse) {
        this.adresse = adresse;
    }
    
    public String getNumeroDeTelephone() {
        return numeroDeTelephone;
    }
    
    public void setNumeroDeTelephone(String numeroDeTelephone) {
        this.numeroDeTelephone = numeroDeTelephone;
    }
    
    public String getAntecedents() {
        return antecedents;
    }
    
    public void setAntecedents(String antecedents) {
        this.antecedents = antecedents;
    }
    
    public String getAllergies() {
        return allergies;
    }
    
    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }
    
    public Integer getNbInterventionsMois() {
        return nbInterventionsMois;
    }
    
    public void setNbInterventionsMois(Integer nbInterventionsMois) {
        this.nbInterventionsMois = nbInterventionsMois;
    }
    
    public LocalDate getDerniereVisite() {
        return derniereVisite;
    }
    
    public void setDerniereVisite(LocalDate derniereVisite) {
        this.derniereVisite = derniereVisite;
    }
    
    public Boolean getActif() {
        return actif;
    }
    
    public void setActif(Boolean actif) {
        this.actif = actif;
    }
}
