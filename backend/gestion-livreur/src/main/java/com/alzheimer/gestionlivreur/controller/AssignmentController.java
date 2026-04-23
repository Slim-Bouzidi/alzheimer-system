package com.alzheimer.gestionlivreur.controller;

import com.alzheimer.gestionlivreur.dto.AssignmentRequestDTO;
import com.alzheimer.gestionlivreur.dto.AssignmentResponseDTO;
import com.alzheimer.gestionlivreur.service.interfaces.IAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final IAssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<AssignmentResponseDTO> create(@Valid @RequestBody AssignmentRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assignmentService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssignmentResponseDTO> update(@PathVariable Long id, @Valid @RequestBody AssignmentRequestDTO request) {
        return ResponseEntity.ok(assignmentService.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssignmentResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<AssignmentResponseDTO>> getAll() {
        return ResponseEntity.ok(assignmentService.getAll());
    }

    @GetMapping("/staff/{username}")
    public ResponseEntity<List<AssignmentResponseDTO>> getByStaff(
            @PathVariable String username,
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(assignmentService.getByStaff(username, activeOnly));
    }

    @GetMapping("/patient/{patientCode}")
    public ResponseEntity<List<AssignmentResponseDTO>> getByPatient(
            @PathVariable String patientCode,
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(assignmentService.getByPatient(patientCode, activeOnly));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<AssignmentResponseDTO> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.deactivate(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        assignmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
