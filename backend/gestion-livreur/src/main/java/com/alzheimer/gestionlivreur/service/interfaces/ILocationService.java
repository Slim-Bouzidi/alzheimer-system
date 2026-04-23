package com.alzheimer.gestionlivreur.service.interfaces;

import com.alzheimer.gestionlivreur.dto.LocationResponseDTO;
import com.alzheimer.gestionlivreur.dto.LocationUpdateDTO;

import java.util.List;

public interface ILocationService {
    LocationResponseDTO saveLocation(LocationUpdateDTO dto);
    LocationResponseDTO getLatestByRoute(Long routeId);
    List<LocationResponseDTO> getTrailByRoute(Long routeId);
}
