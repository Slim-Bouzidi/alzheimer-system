package com.alzheimer.gestionlivreur.controller;

import com.alzheimer.gestionlivreur.dto.LocationResponseDTO;
import com.alzheimer.gestionlivreur.dto.LocationUpdateDTO;
import com.alzheimer.gestionlivreur.service.interfaces.ILocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final ILocationService locationService;

    @PostMapping
    public ResponseEntity<LocationResponseDTO> saveLocation(@Valid @RequestBody LocationUpdateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(locationService.saveLocation(dto));
    }

    @GetMapping("/route/{routeId}/latest")
    public ResponseEntity<LocationResponseDTO> getLatestByRoute(@PathVariable Long routeId) {
        return ResponseEntity.ok(locationService.getLatestByRoute(routeId));
    }

    @GetMapping("/route/{routeId}/trail")
    public ResponseEntity<List<LocationResponseDTO>> getTrailByRoute(@PathVariable Long routeId) {
        return ResponseEntity.ok(locationService.getTrailByRoute(routeId));
    }
}
