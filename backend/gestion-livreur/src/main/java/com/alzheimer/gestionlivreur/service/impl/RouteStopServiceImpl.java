package com.alzheimer.gestionlivreur.service.impl;

import com.alzheimer.gestionlivreur.dto.RouteStopRequestDTO;
import com.alzheimer.gestionlivreur.dto.RouteStopResponseDTO;
import com.alzheimer.gestionlivreur.entity.*;
import com.alzheimer.gestionlivreur.exception.ResourceNotFoundException;
import com.alzheimer.gestionlivreur.repository.PatientRepository;
import com.alzheimer.gestionlivreur.repository.RouteRepo;
import com.alzheimer.gestionlivreur.repository.RouteStopRepo;
import com.alzheimer.gestionlivreur.service.interfaces.IRouteStopService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RouteStopServiceImpl implements IRouteStopService {

    private final RouteStopRepo routeStopRepo;
    private final RouteRepo routeRepo;
    private final PatientRepository patientRepository;

    @Override
    public RouteStopResponseDTO addStop(Long routeId, RouteStopRequestDTO request) {
        Route route = routeRepo.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found: " + routeId));
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + request.getPatientId()));

        RouteStop stop = RouteStop.builder()
                .route(route)
                .patient(patient)
                .stopOrder(request.getStopOrder())
                .status(StopStatus.PENDING)
                .notes(request.getNotes())
                .latitude(patient.getLatitude())
                .longitude(patient.getLongitude())
                .build();

        return toResponse(routeStopRepo.save(stop));
    }

    @Override
    public List<RouteStopResponseDTO> getStops(Long routeId) {
        return routeStopRepo.findByRouteIdOrderByStopOrderAsc(routeId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteStop(Long id) {
        if (!routeStopRepo.existsById(id)) {
            throw new ResourceNotFoundException("RouteStop not found: " + id);
        }
        routeStopRepo.deleteById(id);
    }

    @Override
    public RouteStopResponseDTO markDelivered(Long id) {
        RouteStop stop = routeStopRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RouteStop not found: " + id));
        stop.setStatus(StopStatus.DELIVERED);
        stop.setDeliveredAt(LocalDateTime.now());
        return toResponse(routeStopRepo.save(stop));
    }

    @Override
    public RouteStopResponseDTO markMissed(Long id) {
        RouteStop stop = routeStopRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RouteStop not found: " + id));
        stop.setStatus(StopStatus.MISSED);
        return toResponse(routeStopRepo.save(stop));
    }

    private RouteStopResponseDTO toResponse(RouteStop stop) {
        Patient patient = stop.getPatient();
        return RouteStopResponseDTO.builder()
                .id(stop.getId())
                .routeId(stop.getRoute() != null ? stop.getRoute().getId() : null)
                .patientId(patient != null ? patient.getId() : null)
                .patientCode(patient != null ? patient.getPatientCode() : null)
                .patientFullName(patient != null ? patient.getFirstName() + " " + patient.getLastName() : null)
                .stopOrder(stop.getStopOrder())
                .status(stop.getStatus())
                .deliveredAt(stop.getDeliveredAt())
                .notes(stop.getNotes())
                .latitude(patient != null ? patient.getLatitude() : stop.getLatitude())
                .longitude(patient != null ? patient.getLongitude() : stop.getLongitude())
                .build();
    }
}
