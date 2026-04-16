package com.assistance.assistanceQuotidienne2.controller;

import com.assistance.assistanceQuotidienne2.entity.Patient;
import com.assistance.assistanceQuotidienne2.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "http://localhost:4200") // Pour Angular
public class PatientController {

    @Autowired
    private PatientService patientService;

    // GET tous les patients
    @GetMapping
    public ResponseEntity<List<Patient>> getAllPatients() {
        List<Patient> patients = patientService.getAllPatients();
        return ResponseEntity.ok(patients);
    }

    // GET patient par ID
    @GetMapping("/{id}")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        Optional<Patient> patient = patientService.getPatientById(id);
        return patient.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST créer un patient
    @PostMapping
    public ResponseEntity<Patient> createPatient(@RequestBody Patient patient) {
        Patient savedPatient = patientService.savePatient(patient);
        return ResponseEntity.ok(savedPatient);
    }

    // PUT modifier un patient
    @PutMapping("/{id}")
    public ResponseEntity<Patient> updatePatient(@PathVariable Long id, @RequestBody Patient patient) {
        Optional<Patient> existingPatient = patientService.getPatientById(id);
        if (existingPatient.isPresent()) {
            patient.setId(id);
            Patient updatedPatient = patientService.savePatient(patient);
            return ResponseEntity.ok(updatedPatient);
        }
        return ResponseEntity.notFound().build();
    }

    // DELETE supprimer un patient
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        if (patientService.getPatientById(id).isPresent()) {
            patientService.deletePatient(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // GET rechercher par nom
    @GetMapping("/search")
    public ResponseEntity<List<Patient>> searchPatients(@RequestParam String nom) {
        List<Patient> patients = patientService.searchPatients(nom);
        return ResponseEntity.ok(patients);
    }

    // GET patients actifs
    @GetMapping("/actifs")
    public ResponseEntity<List<Patient>> getActivePatients() {
        List<Patient> patients = patientService.getActivePatients();
        return ResponseEntity.ok(patients);
    }

    // GET patient par téléphone
    @GetMapping("/telephone/{telephone}")
    public ResponseEntity<Patient> getPatientByTelephone(@PathVariable String telephone) {
        Optional<Patient> patient = patientService.getPatientByTelephone(telephone);
        return patient.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
