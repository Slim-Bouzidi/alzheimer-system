package com.alzheimer.gestionlivreur.controller;

import com.alzheimer.gestionlivreur.dto.RouteRequestDTO;
import com.alzheimer.gestionlivreur.dto.RouteResponseDTO;
import com.alzheimer.gestionlivreur.entity.RouteStatus;
import com.alzheimer.gestionlivreur.service.interfaces.IRouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final IRouteService routeService;

    @PostMapping
    public ResponseEntity<RouteResponseDTO> create(@Valid @RequestBody RouteRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(routeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RouteResponseDTO> update(@PathVariable Long id, @Valid @RequestBody RouteRequestDTO request) {
        return ResponseEntity.ok(routeService.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RouteResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(routeService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<RouteResponseDTO>> getAll() {
        return ResponseEntity.ok(routeService.getAll());
    }

    @GetMapping("/date")
    public ResponseEntity<List<RouteResponseDTO>> getByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(routeService.getByDate(date));
    }

    @GetMapping("/staff/{staffId}")
    public ResponseEntity<List<RouteResponseDTO>> getByStaff(@PathVariable Long staffId) {
        return ResponseEntity.ok(routeService.getByStaff(staffId));
    }

    @GetMapping("/status")
    public ResponseEntity<List<RouteResponseDTO>> getByDateAndStatus(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam RouteStatus status) {
        return ResponseEntity.ok(routeService.getByDateAndStatus(date, status));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<RouteResponseDTO> changeStatus(@PathVariable Long id, @RequestParam RouteStatus status) {
        return ResponseEntity.ok(routeService.changeStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        routeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
