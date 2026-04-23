package com.alzheimer.gestionlivreur.controller;

import com.alzheimer.gestionlivreur.dto.RouteStopRequestDTO;
import com.alzheimer.gestionlivreur.dto.RouteStopResponseDTO;
import com.alzheimer.gestionlivreur.service.interfaces.IRouteStopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/route-stops")
@RequiredArgsConstructor
public class RouteStopController {

    private final IRouteStopService routeStopService;

    @PostMapping("/route/{routeId}")
    public ResponseEntity<RouteStopResponseDTO> addStop(@PathVariable Long routeId, @Valid @RequestBody RouteStopRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(routeStopService.addStop(routeId, request));
    }

    @GetMapping("/route/{routeId}")
    public ResponseEntity<List<RouteStopResponseDTO>> getStops(@PathVariable Long routeId) {
        return ResponseEntity.ok(routeStopService.getStops(routeId));
    }

    @PutMapping("/{id}/delivered")
    public ResponseEntity<RouteStopResponseDTO> markDelivered(@PathVariable Long id) {
        return ResponseEntity.ok(routeStopService.markDelivered(id));
    }

    @PutMapping("/{id}/missed")
    public ResponseEntity<RouteStopResponseDTO> markMissed(@PathVariable Long id) {
        return ResponseEntity.ok(routeStopService.markMissed(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStop(@PathVariable Long id) {
        routeStopService.deleteStop(id);
        return ResponseEntity.noContent().build();
    }
}
