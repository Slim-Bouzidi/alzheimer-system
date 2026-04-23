package com.alzheimer.gestionpatient.controller;

import com.alzheimer.gestionpatient.dto.MedicalRecordDTO;
import com.alzheimer.gestionpatient.entity.MedicalRecord;
import com.alzheimer.gestionpatient.service.interfaces.IMedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicalRecord")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final IMedicalRecordService medicalRecordService;

    @PostMapping("/addMedicalRecord")
    public ResponseEntity<MedicalRecord> addMedicalRecord(@RequestBody MedicalRecordDTO dto) {
        return new ResponseEntity<>(medicalRecordService.addMedicalRecord(dto), HttpStatus.CREATED);
    }

    @GetMapping("/allMedicalRecord")
    public ResponseEntity<List<MedicalRecord>> getAllMedicalRecords() {
        return ResponseEntity.ok(medicalRecordService.getAllMedicalRecords());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicalRecord> getMedicalRecordById(@PathVariable Integer id) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordById(id));
    }

    @PutMapping("/update")
    public ResponseEntity<MedicalRecord> updateMedicalRecord(@RequestBody MedicalRecord medicalRecord) {
        return ResponseEntity.ok(medicalRecordService.updateMedicalRecord(medicalRecord));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteMedicalRecord(@PathVariable Integer id) {
        medicalRecordService.deleteMedicalRecord(id);
        return ResponseEntity.noContent().build();
    }
}
