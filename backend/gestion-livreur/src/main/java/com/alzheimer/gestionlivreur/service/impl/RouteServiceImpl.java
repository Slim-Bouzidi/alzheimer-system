package com.alzheimer.gestionlivreur.service.impl;

import com.alzheimer.gestionlivreur.dto.RouteRequestDTO;
import com.alzheimer.gestionlivreur.dto.RouteResponseDTO;
import com.alzheimer.gestionlivreur.dto.RouteStopResponseDTO;
import com.alzheimer.gestionlivreur.entity.*;
import com.alzheimer.gestionlivreur.exception.ResourceNotFoundException;
import com.alzheimer.gestionlivreur.repository.MealSlotRepo;
import com.alzheimer.gestionlivreur.repository.RouteRepo;
import com.alzheimer.gestionlivreur.repository.RouteStopRepo;
import com.alzheimer.gestionlivreur.repository.StaffProfileRepo;
import com.alzheimer.gestionlivreur.service.interfaces.IRouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements IRouteService {

    private final RouteRepo routeRepo;
    private final RouteStopRepo routeStopRepo;
    private final MealSlotRepo mealSlotRepo;
    private final StaffProfileRepo staffProfileRepo;

    @Override
    public RouteResponseDTO create(RouteRequestDTO request) {
        MealSlot mealSlot = mealSlotRepo.findById(request.getMealSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("MealSlot not found: " + request.getMealSlotId()));
        StaffProfile staff = staffProfileRepo.findById(request.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + request.getStaffId()));

        Route route = Route.builder()
                .routeDate(request.getRouteDate())
                .mealSlot(mealSlot)
                .staff(staff)
                .status(RouteStatus.PLANNED)
                .active(true)
                .label(request.getLabel())
                .build();

        return toResponse(routeRepo.save(route));
    }

    @Override
    public RouteResponseDTO update(Long id, RouteRequestDTO request) {
        Route route = routeRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found: " + id));

        MealSlot mealSlot = mealSlotRepo.findById(request.getMealSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("MealSlot not found: " + request.getMealSlotId()));
        StaffProfile staff = staffProfileRepo.findById(request.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + request.getStaffId()));

        route.setRouteDate(request.getRouteDate());
        route.setMealSlot(mealSlot);
        route.setStaff(staff);
        route.setLabel(request.getLabel());

        return toResponse(routeRepo.save(route));
    }

    @Override
    public RouteResponseDTO getById(Long id) {
        return toResponse(routeRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found: " + id)));
    }

    @Override
    public List<RouteResponseDTO> getAll() {
        return routeRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<RouteResponseDTO> getByDate(LocalDate date) {
        return routeRepo.findByRouteDate(date).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<RouteResponseDTO> getByStaff(Long staffId) {
        return routeRepo.findByStaffId(staffId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<RouteResponseDTO> getByDateAndStatus(LocalDate date, RouteStatus status) {
        return routeRepo.findByRouteDateAndStatus(date, status).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public RouteResponseDTO changeStatus(Long id, RouteStatus status) {
        Route route = routeRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found: " + id));
        route.setStatus(status);
        return toResponse(routeRepo.save(route));
    }

    @Override
    public void delete(Long id) {
        if (!routeRepo.existsById(id)) {
            throw new ResourceNotFoundException("Route not found: " + id);
        }
        routeRepo.deleteById(id);
    }

    private RouteResponseDTO toResponse(Route route) {
        List<RouteStop> stops = routeStopRepo.findByRouteIdOrderByStopOrderAsc(route.getId());
        List<RouteStopResponseDTO> stopDTOs = stops != null
                ? stops.stream().map(this::toStopResponse).collect(Collectors.toList())
                : Collections.emptyList();

        return RouteResponseDTO.builder()
                .id(route.getId())
                .routeDate(route.getRouteDate())
                .mealSlotId(route.getMealSlot() != null ? route.getMealSlot().getId() : null)
                .staffId(route.getStaff() != null ? route.getStaff().getId() : null)
                .status(route.getStatus())
                .active(route.getActive())
                .label(route.getLabel())
                .stops(stopDTOs)
                .build();
    }

    private RouteStopResponseDTO toStopResponse(RouteStop stop) {
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
