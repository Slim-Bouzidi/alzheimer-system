package org.example.alzheimerapp.controllers;

import org.example.alzheimerapp.entities.Patient;
import org.example.alzheimerapp.services.interfaces.IPatientService;
import org.example.alzheimerapp.services.implementing.PdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patient")
public class PatientController {

    private final IPatientService patientService;
    private final PdfService pdfService;

    public PatientController(IPatientService patientService, PdfService pdfService) {
        this.patientService = patientService;
        this.pdfService = pdfService;
    }

    // ➕ Add patient
    @PostMapping("/addPatient")
    public Patient addPatient(@RequestBody Patient patient) {
        return patientService.addPatient(patient);
    }

    // 📋 Get all patients (admin use)
    @GetMapping("/allPatient")
    public List<Patient> getAllPatients() {
        return patientService.getAllPatients();
    }

    // 🔍 Get one patient by ID
    @GetMapping("/{id}")
    public Patient getPatient(@PathVariable("id") Integer id) {
        return patientService.getPatientById(id);
    }

    // ✏️ Update patient
    @PutMapping("/update")
    public Patient updatePatient(@RequestBody Patient patient) {
        return patientService.updatePatient(patient);
    }

    // ❌ Delete patient
    @DeleteMapping("/delete/{id}")
    public void deletePatient(@PathVariable("id") Integer id) {
        patientService.deletePatient(id);
    }

    // 👩‍⚕️ NEW: Get patients assigned to a specific soignant
    @GetMapping("/soignant/{id}")
    public List<Patient> getPatientsBySoignant(@PathVariable("id") Long id) {
        return patientService.getPatientsBySoignant(id);
    }

    // 🟢 NEW: Get patients sorted by status
    @GetMapping("/sortedByStatus")
    public List<Patient> getPatientsSortedByStatus() {
        return patientService.getPatientsSortedByStatus();
    }

    // 📄 NEW: Export patient treatments to PDF
    @GetMapping("/{id}/treatments/pdf")
    public ResponseEntity<byte[]> exportTreatmentsToPdf(@PathVariable("id") Integer id) {
        Patient patient = patientService.getPatientById(id);

        byte[] pdfBytes = pdfService.generateTreatmentPdf(patient);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "treatments_" + id + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}