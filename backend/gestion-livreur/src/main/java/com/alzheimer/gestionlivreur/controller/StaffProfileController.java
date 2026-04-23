package com.alzheimer.gestionlivreur.controller;

import com.alzheimer.gestionlivreur.dto.StaffProfileRequestDTO;
import com.alzheimer.gestionlivreur.dto.StaffProfileResponseDTO;
import com.alzheimer.gestionlivreur.service.interfaces.IStaffProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/staff-profiles")
@RequiredArgsConstructor
public class StaffProfileController {

    private final IStaffProfileService staffProfileService;

    @PostMapping
    public ResponseEntity<StaffProfileResponseDTO> create(@Valid @RequestBody StaffProfileRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(staffProfileService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StaffProfileResponseDTO> update(@PathVariable Long id, @Valid @RequestBody StaffProfileRequestDTO request) {
        return ResponseEntity.ok(staffProfileService.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StaffProfileResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(staffProfileService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<StaffProfileResponseDTO>> getAll() {
        return ResponseEntity.ok(staffProfileService.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<StaffProfileResponseDTO>> getActive() {
        return ResponseEntity.ok(staffProfileService.getActive());
    }

    @GetMapping("/search")
    public ResponseEntity<List<StaffProfileResponseDTO>> searchByName(@RequestParam String q) {
        return ResponseEntity.ok(staffProfileService.searchByName(q));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<StaffProfileResponseDTO> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(staffProfileService.deactivate(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        staffProfileService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
