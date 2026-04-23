package com.alzheimer.gestionlivreur.service.interfaces;

import com.alzheimer.gestionlivreur.dto.DeliveryTaskRequestDTO;
import com.alzheimer.gestionlivreur.dto.DeliveryTaskResponseDTO;
import com.alzheimer.gestionlivreur.entity.DeliveryStatus;

import java.time.LocalDate;
import java.util.List;

public interface IDeliveryTaskService {
    DeliveryTaskResponseDTO create(DeliveryTaskRequestDTO request);
    DeliveryTaskResponseDTO update(Long id, DeliveryTaskRequestDTO request);
    DeliveryTaskResponseDTO getById(Long id);
    List<DeliveryTaskResponseDTO> getAll();
    List<DeliveryTaskResponseDTO> getByDate(LocalDate date);
    List<DeliveryTaskResponseDTO> getByPatient(String patientCode);
    List<DeliveryTaskResponseDTO> getByStaff(String username);
    List<DeliveryTaskResponseDTO> getByDateAndStatus(LocalDate date, DeliveryStatus status);
    DeliveryTaskResponseDTO confirm(Long id);
    DeliveryTaskResponseDTO markDelivered(Long id);
    void delete(Long id);
}
