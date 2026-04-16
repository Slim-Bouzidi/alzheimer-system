package com.assistance.assistanceQuotidienne2.service;

import com.assistance.assistanceQuotidienne2.entity.Patient;
import com.assistance.assistanceQuotidienne2.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    // Obtenir tous les patients
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    // Obtenir un patient par ID
    public Optional<Patient> getPatientById(Long id) {
        return patientRepository.findById(id);
    }

    // Sauvegarder un patient (créer ou modifier)
    public Patient savePatient(Patient patient) {
        return patientRepository.save(patient);
    }

    // Supprimer un patient
    public void deletePatient(Long id) {
        patientRepository.deleteById(id);
    }

    // Rechercher des patients par nom
    public List<Patient> searchPatients(String nom) {
        return patientRepository.findByNomCompletContaining(nom);
    }

    // Obtenir les patients actifs
    public List<Patient> getActivePatients() {
        return patientRepository.findByActifTrue();
    }

    // Obtenir un patient par téléphone
    public Optional<Patient> getPatientByTelephone(String telephone) {
        return patientRepository.findByNumeroDeTelephone(telephone);
    }

    // Compter les interventions du mois pour un patient
    public Long getInterventionsMois(Long patientId) {
        return patientRepository.countInterventionsMois(patientId);
    }

    // Désactiver un patient (soft delete)
    public void desactiverPatient(Long id) {
        Optional<Patient> patient = patientRepository.findById(id);
        if (patient.isPresent()) {
            patient.get().setActif(false);
            patientRepository.save(patient.get());
        }
    }

    // Activer un patient
    public void activerPatient(Long id) {
        Optional<Patient> patient = patientRepository.findById(id);
        if (patient.isPresent()) {
            patient.get().setActif(true);
            patientRepository.save(patient.get());
        }
    }
}
