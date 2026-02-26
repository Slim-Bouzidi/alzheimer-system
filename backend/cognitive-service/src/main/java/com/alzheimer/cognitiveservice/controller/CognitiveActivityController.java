package com.alzheimer.cognitiveservice.controller;

import com.alzheimer.cognitiveservice.dto.ActivityRequest;
import com.alzheimer.cognitiveservice.dto.ActivityResponse;
import com.alzheimer.cognitiveservice.service.CognitiveActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cognitive-activities")
@RequiredArgsConstructor
public class CognitiveActivityController {

    private final CognitiveActivityService service;

    @PostMapping
    public ResponseEntity<ActivityResponse> save(@RequestBody ActivityRequest request) {
        return ResponseEntity.ok(service.saveActivity(request));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ActivityResponse>> getPatientActivities(@PathVariable String patientId) {
        return ResponseEntity.ok(service.getPatientActivities(patientId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteActivity(id);
        return ResponseEntity.noContent().build();
    }
}
