package org.example.alzheimerapp.controllers;

import org.example.alzheimerapp.dtos.MedicalRecordDTO;
import org.example.alzheimerapp.entities.MedicalRecord;
import org.example.alzheimerapp.entities.Patient;
import org.example.alzheimerapp.repositories.PatientRepository;
import org.example.alzheimerapp.services.interfaces.IMedicalRecordService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.text.SimpleDateFormat;
import java.util.Date;

@RestController
@RequestMapping("/api/medicalRecord")
public class MedicalRecordController {

    private final IMedicalRecordService medicalRecordService;
    private final PatientRepository patientRepository;

    public MedicalRecordController(IMedicalRecordService medicalRecordService, PatientRepository patientRepository) {
        this.medicalRecordService = medicalRecordService;
        this.patientRepository = patientRepository;
    }

    @PostMapping("/addMedicalRecord")
    public MedicalRecord addMedicalRecord(@RequestBody MedicalRecordDTO dto) {
        System.out.println("=== RECEPTION DOSSIER MEDICAL ===");
        System.out.println("Diagnosis: " + dto.getDiagnosis());
        System.out.println("Disease Stage: " + dto.getDiseaseStage());
        System.out.println("Medical History: " + dto.getMedicalHistory());
        System.out.println("Allergies: " + dto.getAllergies());
        System.out.println("Patient ID: " + dto.getPatientId());
        System.out.println("===================================");

        // Charger le patient depuis la base de données
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient non trouvé avec l'ID: " + dto.getPatientId()));

        // Créer l'entité MedicalRecord avec les données du DTO
        MedicalRecord record = new MedicalRecord();
        record.setDiagnosis(dto.getDiagnosis());
        record.setDiseaseStage(dto.getDiseaseStage());
        record.setMedicalHistory(dto.getMedicalHistory());
        record.setAllergies(dto.getAllergies());
        record.setPatient(patient);

        // Ajouter la date d'enregistrement actuelle si non fournie
        if (dto.getRecordDate() != null && !dto.getRecordDate().isEmpty()) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
                record.setRecordDate(sdf.parse(dto.getRecordDate()));
            } catch (Exception e) {
                System.out.println("Erreur conversion date: " + e.getMessage());
            }
        } else {
            record.setRecordDate(new Date());
        }

        System.out.println("=== DOSSIER MEDICAL CRÉÉ ===");
        System.out.println("Diagnosis: " + record.getDiagnosis());
        System.out.println("Disease Stage: " + record.getDiseaseStage());
        System.out.println("Medical History: " + record.getMedicalHistory());
        System.out.println("Allergies: " + record.getAllergies());
        System.out.println("Patient ID: " + record.getPatient().getIdPatient());
        System.out.println("=============================");

        return medicalRecordService.addMedicalRecord(record);
    }

    @GetMapping("/allMedicalRecord")
    public List<MedicalRecord> getAllMedicalRecords() {
        return medicalRecordService.getAllMedicalRecords();
    }

    @GetMapping("/{id}")
    public MedicalRecord getMedicalRecord(@PathVariable("id") Integer id) {
        return medicalRecordService.getMedicalRecordById(id);
    }

    @PutMapping("/update")
    public MedicalRecord updateMedicalRecord(@RequestBody MedicalRecord medicalRecord) {
        return medicalRecordService.updateMedicalRecord(medicalRecord);
    }

    @DeleteMapping("/delete/{id}")
    public void deleteMedicalRecord(@PathVariable("id") Integer id) {
        medicalRecordService.deleteMedicalRecord(id);
    }
}
