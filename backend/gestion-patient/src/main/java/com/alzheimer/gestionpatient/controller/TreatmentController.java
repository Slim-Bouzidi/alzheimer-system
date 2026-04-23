package com.alzheimer.gestionpatient.controller;

import com.alzheimer.gestionpatient.dto.TreatmentDTO;
import com.alzheimer.gestionpatient.entity.Treatment;
import com.alzheimer.gestionpatient.service.interfaces.ITreatmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/treatment")
@RequiredArgsConstructor
public class TreatmentController {

    private final ITreatmentService treatmentService;

    @PostMapping("/addTreatment")
    public ResponseEntity<Treatment> addTreatment(@RequestBody TreatmentDTO dto) {
        return new ResponseEntity<>(treatmentService.addTreatment(dto), HttpStatus.CREATED);
    }

    @GetMapping("/allTreatment")
    public ResponseEntity<List<Treatment>> getAllTreatments() {
        return ResponseEntity.ok(treatmentService.getAllTreatments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Treatment> getTreatmentById(@PathVariable Integer id) {
        return ResponseEntity.ok(treatmentService.getTreatmentById(id));
    }

    @PutMapping("/update")
    public ResponseEntity<Treatment> updateTreatment(@RequestBody Treatment treatment) {
        return ResponseEntity.ok(treatmentService.updateTreatment(treatment));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteTreatment(@PathVariable Integer id) {
        treatmentService.deleteTreatment(id);
        return ResponseEntity.noContent().build();
    }
}
