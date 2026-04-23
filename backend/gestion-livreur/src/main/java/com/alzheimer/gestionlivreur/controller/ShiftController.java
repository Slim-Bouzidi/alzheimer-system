package com.alzheimer.gestionlivreur.controller;

import com.alzheimer.gestionlivreur.dto.ShiftRequestDTO;
import com.alzheimer.gestionlivreur.dto.ShiftResponseDTO;
import com.alzheimer.gestionlivreur.service.interfaces.IShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.DayOfWeek;
import java.util.List;

@RestController
@RequestMapping("/api/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final IShiftService shiftService;

    @PostMapping
    public ResponseEntity<ShiftResponseDTO> create(@Valid @RequestBody ShiftRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shiftService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShiftResponseDTO> update(@PathVariable Long id, @Valid @RequestBody ShiftRequestDTO request) {
        return ResponseEntity.ok(shiftService.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShiftResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(shiftService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<ShiftResponseDTO>> getAll() {
        return ResponseEntity.ok(shiftService.getAll());
    }

    @GetMapping("/staff/{staffId}")
    public ResponseEntity<List<ShiftResponseDTO>> getByStaff(@PathVariable Long staffId) {
        return ResponseEntity.ok(shiftService.getByStaff(staffId));
    }

    @GetMapping("/day")
    public ResponseEntity<List<ShiftResponseDTO>> getByDay(@RequestParam DayOfWeek day) {
        return ResponseEntity.ok(shiftService.getByDay(day));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<ShiftResponseDTO> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(shiftService.deactivate(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        shiftService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
