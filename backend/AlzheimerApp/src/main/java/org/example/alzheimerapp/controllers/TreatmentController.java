package org.example.alzheimerapp.controllers;

import org.example.alzheimerapp.dtos.TreatmentDTO;
import org.example.alzheimerapp.entities.Treatment;
import org.example.alzheimerapp.entities.Patient;
import org.example.alzheimerapp.repositories.PatientRepository;
import org.example.alzheimerapp.services.interfaces.ITreatmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.text.SimpleDateFormat;

@RestController
@RequestMapping("/api/treatment")
public class TreatmentController {

    private final ITreatmentService treatmentService;
    private final PatientRepository patientRepository;

    public TreatmentController(ITreatmentService treatmentService, PatientRepository patientRepository) {
        this.treatmentService = treatmentService;
        this.patientRepository = patientRepository;
    }

    @PostMapping("/addTreatment")
    public Treatment addTreatment(@RequestBody TreatmentDTO dto) {
        System.out.println("=== RECEPTION TRAITEMENT ===");
        System.out.println("Treatment Name: " + dto.getTreatmentName());
        System.out.println("Dosage: " + dto.getDosage());
        System.out.println("Frequency: " + dto.getFrequency());
        System.out.println("Start Date: " + dto.getStartDate());
        System.out.println("End Date: " + dto.getEndDate());
        System.out.println("Status: " + dto.getStatus());
        System.out.println("Patient ID: " + dto.getPatientId());
        System.out.println("=============================");

        // Charger le patient depuis la base de données
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient non trouvé avec l'ID: " + dto.getPatientId()));

        // Créer l'entité Treatment avec les données du DTO
        Treatment treatment = new Treatment();
        treatment.setTreatmentName(dto.getTreatmentName());
        treatment.setDosage(dto.getDosage());
        treatment.setFrequency(dto.getFrequency());
        treatment.setStatus(dto.getStatus());
        treatment.setPatient(patient);

        // Convertir les dates si elles sont fournies
        if (dto.getStartDate() != null && !dto.getStartDate().isEmpty()) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
                treatment.setStartDate(sdf.parse(dto.getStartDate()));
            } catch (Exception e) {
                System.out.println("Erreur conversion date début: " + e.getMessage());
            }
        }

        if (dto.getEndDate() != null && !dto.getEndDate().isEmpty()) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
                treatment.setEndDate(sdf.parse(dto.getEndDate()));
            } catch (Exception e) {
                System.out.println("Erreur conversion date fin: " + e.getMessage());
            }
        }

        System.out.println("=== TRAITEMENT CRÉÉ ===");
        System.out.println("Treatment Name: " + treatment.getTreatmentName());
        System.out.println("Dosage: " + treatment.getDosage());
        System.out.println("Frequency: " + treatment.getFrequency());
        System.out.println("Status: " + treatment.getStatus());
        System.out.println("Patient ID: " + treatment.getPatient().getIdPatient());
        System.out.println("========================");

        return treatmentService.addTreatment(treatment);
    }

    @GetMapping("/allTreatment")
    public List<Treatment> getAllTreatments() {
        return treatmentService.getAllTreatments();
    }

    @GetMapping("/{id}")
    public Treatment getTreatment(@PathVariable("id") Integer id) {
        return treatmentService.getTreatmentById(id);
    }

    @PutMapping("/update")
    public Treatment updateTreatment(@RequestBody Treatment treatment) {
        return treatmentService.updateTreatment(treatment);
    }

    @DeleteMapping("/delete/{id}")
    public void deleteTreatment(@PathVariable("id") Integer id) {
        treatmentService.deleteTreatment(id);
    }
}
