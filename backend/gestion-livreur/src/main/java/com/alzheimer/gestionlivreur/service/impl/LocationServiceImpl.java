package com.alzheimer.gestionlivreur.service.impl;

import com.alzheimer.gestionlivreur.dto.LocationResponseDTO;
import com.alzheimer.gestionlivreur.dto.LocationUpdateDTO;
import com.alzheimer.gestionlivreur.entity.LocationUpdate;
import com.alzheimer.gestionlivreur.exception.ResourceNotFoundException;
import com.alzheimer.gestionlivreur.repository.LocationUpdateRepository;
import com.alzheimer.gestionlivreur.service.interfaces.ILocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationServiceImpl implements ILocationService {

    private final LocationUpdateRepository locationUpdateRepository;

    @Override
    public LocationResponseDTO saveLocation(LocationUpdateDTO dto) {
        LocationUpdate update = LocationUpdate.builder()
                .staffId(dto.getStaffId())
                .routeId(dto.getRouteId())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .timestamp(LocalDateTime.now())
                .build();

        return toResponse(locationUpdateRepository.save(update));
    }

    @Override
    public LocationResponseDTO getLatestByRoute(Long routeId) {
        LocationUpdate update = locationUpdateRepository.findTopByRouteIdOrderByTimestampDesc(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("No location found for route: " + routeId));
        return toResponse(update);
    }

    @Override
    public List<LocationResponseDTO> getTrailByRoute(Long routeId) {
        return locationUpdateRepository.findByRouteIdOrderByTimestampAsc(routeId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private LocationResponseDTO toResponse(LocationUpdate update) {
        return LocationResponseDTO.builder()
                .id(update.getId())
                .staffId(update.getStaffId())
                .routeId(update.getRouteId())
                .latitude(update.getLatitude())
                .longitude(update.getLongitude())
                .timestamp(update.getTimestamp())
                .build();
    }
}
