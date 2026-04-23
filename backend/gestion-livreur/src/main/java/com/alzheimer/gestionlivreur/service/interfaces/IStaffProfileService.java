package com.alzheimer.gestionlivreur.service.interfaces;

import com.alzheimer.gestionlivreur.dto.StaffProfileRequestDTO;
import com.alzheimer.gestionlivreur.dto.StaffProfileResponseDTO;

import java.util.List;

public interface IStaffProfileService {
    StaffProfileResponseDTO create(StaffProfileRequestDTO request);
    StaffProfileResponseDTO update(Long id, StaffProfileRequestDTO request);
    StaffProfileResponseDTO getById(Long id);
    List<StaffProfileResponseDTO> getAll();
    List<StaffProfileResponseDTO> getActive();
    List<StaffProfileResponseDTO> searchByName(String query);
    StaffProfileResponseDTO deactivate(Long id);
    void delete(Long id);
}
