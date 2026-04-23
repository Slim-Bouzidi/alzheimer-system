package com.alzheimer.gestionlivreur.controller;

import com.alzheimer.gestionlivreur.dto.DeliveryTaskRequestDTO;
import com.alzheimer.gestionlivreur.dto.DeliveryTaskResponseDTO;
import com.alzheimer.gestionlivreur.entity.DeliveryStatus;
import com.alzheimer.gestionlivreur.service.interfaces.IDeliveryTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/delivery-tasks")
@RequiredArgsConstructor
public class DeliveryTaskController {

    private final IDeliveryTaskService deliveryTaskService;

    @PostMapping
    public ResponseEntity<DeliveryTaskResponseDTO> create(@Valid @RequestBody DeliveryTaskRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deliveryTaskService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeliveryTaskResponseDTO> update(@PathVariable Long id, @Valid @RequestBody DeliveryTaskRequestDTO request) {
        return ResponseEntity.ok(deliveryTaskService.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeliveryTaskResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(deliveryTaskService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<DeliveryTaskResponseDTO>> getAll() {
        return ResponseEntity.ok(deliveryTaskService.getAll());
    }

    @GetMapping("/date")
    public ResponseEntity<List<DeliveryTaskResponseDTO>> getByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(deliveryTaskService.getByDate(date));
    }

    @GetMapping("/patient/{patientCode}")
    public ResponseEntity<List<DeliveryTaskResponseDTO>> getByPatient(@PathVariable String patientCode) {
        return ResponseEntity.ok(deliveryTaskService.getByPatient(patientCode));
    }

    @GetMapping("/staff/{username}")
    public ResponseEntity<List<DeliveryTaskResponseDTO>> getByStaff(@PathVariable String username) {
        return ResponseEntity.ok(deliveryTaskService.getByStaff(username));
    }

    @GetMapping("/status")
    public ResponseEntity<List<DeliveryTaskResponseDTO>> getByDateAndStatus(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam DeliveryStatus status) {
        return ResponseEntity.ok(deliveryTaskService.getByDateAndStatus(date, status));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<DeliveryTaskResponseDTO> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(deliveryTaskService.confirm(id));
    }

    @PutMapping("/{id}/delivered")
    public ResponseEntity<DeliveryTaskResponseDTO> markDelivered(@PathVariable Long id) {
        return ResponseEntity.ok(deliveryTaskService.markDelivered(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deliveryTaskService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
