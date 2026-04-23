package com.alzheimer.gestionpatient.controller;

import com.alzheimer.gestionpatient.entity.Patient;
import com.alzheimer.gestionpatient.service.impl.PdfService;
import com.alzheimer.gestionpatient.service.interfaces.IPatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
public class PatientController {

    private final IPatientService patientService;
    private final PdfService pdfService;

    @PostMapping("/addPatient")
    public ResponseEntity<Patient> addPatient(@RequestBody Patient patient) {
        return new ResponseEntity<>(patientService.addPatient(patient), HttpStatus.CREATED);
    }

    @GetMapping("/allPatient")
    public ResponseEntity<List<Patient>> getAllPatients() {
        return ResponseEntity.ok(patientService.getAllPatients());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Patient> getPatientById(@PathVariable Integer id) {
        return ResponseEntity.ok(patientService.getPatientById(id));
    }

    @PutMapping("/update")
    public ResponseEntity<Patient> updatePatient(@RequestBody Patient patient) {
        return ResponseEntity.ok(patientService.updatePatient(patient));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deletePatient(@PathVariable Integer id) {
        patientService.deletePatient(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/soignant/{id}")
    public ResponseEntity<List<Patient>> getPatientsBySoignant(@PathVariable Long id) {
        return ResponseEntity.ok(patientService.getPatientsBySoignant(id));
    }

    @GetMapping("/sortedByStatus")
    public ResponseEntity<List<Patient>> getPatientsSortedByStatus() {
        return ResponseEntity.ok(patientService.getPatientsSortedByStatus());
    }

    @GetMapping("/{id}/treatments/pdf")
    public ResponseEntity<byte[]> exportTreatmentsPdf(@PathVariable Integer id) {
        Patient patient = patientService.getPatientById(id);
        byte[] pdfBytes = pdfService.generateTreatmentPdf(patient);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment",
                "treatments_" + patient.getFirstName() + "_" + patient.getLastName() + ".pdf");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
