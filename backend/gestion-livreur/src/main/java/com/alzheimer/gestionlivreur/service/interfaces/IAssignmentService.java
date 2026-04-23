package com.alzheimer.gestionlivreur.service.interfaces;

import com.alzheimer.gestionlivreur.dto.AssignmentRequestDTO;
import com.alzheimer.gestionlivreur.dto.AssignmentResponseDTO;

import java.util.List;

public interface IAssignmentService {
    AssignmentResponseDTO create(AssignmentRequestDTO request);
    AssignmentResponseDTO update(Long id, AssignmentRequestDTO request);
    AssignmentResponseDTO getById(Long id);
    List<AssignmentResponseDTO> getAll();
    List<AssignmentResponseDTO> getByStaff(String username, boolean activeOnly);
    List<AssignmentResponseDTO> getByPatient(String patientCode, boolean activeOnly);
    AssignmentResponseDTO deactivate(Long id);
    void delete(Long id);
}
