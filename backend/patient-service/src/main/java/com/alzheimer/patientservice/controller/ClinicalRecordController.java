package com.alzheimer.patientservice.controller;

import com.alzheimer.patientservice.dto.ClinicalRecordRequest;
import com.alzheimer.patientservice.dto.ClinicalRecordResponse;
import com.alzheimer.patientservice.service.ClinicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/clinical-records")
@RequiredArgsConstructor
public class ClinicalRecordController {

    private final ClinicalRecordService service;

    @PostMapping
    public ResponseEntity<ClinicalRecordResponse> create(@Valid @RequestBody ClinicalRecordRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ClinicalRecordResponse>> findByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(service.findByPatientId(patientId));
    }

    @GetMapping("/me")
    public ResponseEntity<List<ClinicalRecordResponse>> findMyRecords(@RequestHeader("X-User-Id") String keycloakId) {
        return ResponseEntity.ok(service.findMyRecords(keycloakId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClinicalRecordResponse> update(@PathVariable Long id, @Valid @RequestBody ClinicalRecordRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
