package com.alzheimer.gestionlivreur.service.interfaces;

import com.alzheimer.gestionlivreur.dto.RouteStopRequestDTO;
import com.alzheimer.gestionlivreur.dto.RouteStopResponseDTO;

import java.util.List;

public interface IRouteStopService {
    RouteStopResponseDTO addStop(Long routeId, RouteStopRequestDTO request);
    List<RouteStopResponseDTO> getStops(Long routeId);
    void deleteStop(Long id);
    RouteStopResponseDTO markDelivered(Long id);
    RouteStopResponseDTO markMissed(Long id);
}
