package com.alzheimer.gestionlivreur.service.interfaces;

import com.alzheimer.gestionlivreur.dto.ShiftRequestDTO;
import com.alzheimer.gestionlivreur.dto.ShiftResponseDTO;

import java.time.DayOfWeek;
import java.util.List;

public interface IShiftService {
    ShiftResponseDTO create(ShiftRequestDTO request);
    ShiftResponseDTO update(Long id, ShiftRequestDTO request);
    ShiftResponseDTO getById(Long id);
    List<ShiftResponseDTO> getAll();
    List<ShiftResponseDTO> getByStaff(Long staffId);
    List<ShiftResponseDTO> getByDay(DayOfWeek day);
    ShiftResponseDTO deactivate(Long id);
    void delete(Long id);
}
