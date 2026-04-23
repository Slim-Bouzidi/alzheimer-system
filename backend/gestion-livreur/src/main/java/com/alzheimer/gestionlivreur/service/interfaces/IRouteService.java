package com.alzheimer.gestionlivreur.service.interfaces;

import com.alzheimer.gestionlivreur.dto.RouteRequestDTO;
import com.alzheimer.gestionlivreur.dto.RouteResponseDTO;
import com.alzheimer.gestionlivreur.entity.RouteStatus;

import java.time.LocalDate;
import java.util.List;

public interface IRouteService {
    RouteResponseDTO create(RouteRequestDTO request);
    RouteResponseDTO update(Long id, RouteRequestDTO request);
    RouteResponseDTO getById(Long id);
    List<RouteResponseDTO> getAll();
    List<RouteResponseDTO> getByDate(LocalDate date);
    List<RouteResponseDTO> getByStaff(Long staffId);
    List<RouteResponseDTO> getByDateAndStatus(LocalDate date, RouteStatus status);
    RouteResponseDTO changeStatus(Long id, RouteStatus status);
    void delete(Long id);
}
