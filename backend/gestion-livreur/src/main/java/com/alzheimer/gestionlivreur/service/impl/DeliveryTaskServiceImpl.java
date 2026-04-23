package com.alzheimer.gestionlivreur.service.impl;

import com.alzheimer.gestionlivreur.dto.DeliveryTaskRequestDTO;
import com.alzheimer.gestionlivreur.dto.DeliveryTaskResponseDTO;
import com.alzheimer.gestionlivreur.entity.*;
import com.alzheimer.gestionlivreur.exception.ResourceNotFoundException;
import com.alzheimer.gestionlivreur.repository.DeliveryTaskRepo;
import com.alzheimer.gestionlivreur.repository.PatientRepository;
import com.alzheimer.gestionlivreur.repository.StaffProfileRepo;
import com.alzheimer.gestionlivreur.service.interfaces.IDeliveryTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryTaskServiceImpl implements IDeliveryTaskService {

    private final DeliveryTaskRepo deliveryTaskRepo;
    private final PatientRepository patientRepository;
    private final StaffProfileRepo staffProfileRepo;

    @Override
    public DeliveryTaskResponseDTO create(DeliveryTaskRequestDTO request) {
        Patient patient = patientRepository.findByPatientCodeIgnoreCase(request.getPatientCode())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + request.getPatientCode()));

        Long staffId = null;
        if (request.getAssignedStaffUsername() != null && !request.getAssignedStaffUsername().isBlank()) {
            StaffProfile staff = staffProfileRepo.findByUsernameIgnoreCase(request.getAssignedStaffUsername())
                    .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + request.getAssignedStaffUsername()));
            staffId = staff.getId();
        }

        DeliveryTask task = DeliveryTask.builder()
                .patientId(patient.getId())
                .deliveryDate(request.getDeliveryDate())
                .plannedTime(request.getPlannedTime())
                .status(DeliveryStatus.PLANNED)
                .assignedStaffId(staffId)
                .notes(request.getNotes())
                .build();

        return toResponse(deliveryTaskRepo.save(task));
    }

    @Override
    public DeliveryTaskResponseDTO update(Long id, DeliveryTaskRequestDTO request) {
        DeliveryTask task = deliveryTaskRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryTask not found: " + id));

        Patient patient = patientRepository.findByPatientCodeIgnoreCase(request.getPatientCode())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + request.getPatientCode()));

        task.setPatientId(patient.getId());
        task.setDeliveryDate(request.getDeliveryDate());
        task.setPlannedTime(request.getPlannedTime());
        task.setNotes(request.getNotes());

        if (request.getAssignedStaffUsername() != null && !request.getAssignedStaffUsername().isBlank()) {
            StaffProfile staff = staffProfileRepo.findByUsernameIgnoreCase(request.getAssignedStaffUsername())
                    .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + request.getAssignedStaffUsername()));
            task.setAssignedStaffId(staff.getId());
        }

        return toResponse(deliveryTaskRepo.save(task));
    }

    @Override
    public DeliveryTaskResponseDTO getById(Long id) {
        return toResponse(deliveryTaskRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryTask not found: " + id)));
    }

    @Override
    public List<DeliveryTaskResponseDTO> getAll() {
        return deliveryTaskRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<DeliveryTaskResponseDTO> getByDate(LocalDate date) {
        return deliveryTaskRepo.findByDeliveryDate(date).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<DeliveryTaskResponseDTO> getByPatient(String patientCode) {
        Patient patient = patientRepository.findByPatientCodeIgnoreCase(patientCode)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientCode));
        return deliveryTaskRepo.findByPatientId(patient.getId()).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<DeliveryTaskResponseDTO> getByStaff(String username) {
        StaffProfile staff = staffProfileRepo.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + username));
        return deliveryTaskRepo.findByAssignedStaffId(staff.getId()).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<DeliveryTaskResponseDTO> getByDateAndStatus(LocalDate date, DeliveryStatus status) {
        return deliveryTaskRepo.findByDeliveryDateAndStatus(date, status).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public DeliveryTaskResponseDTO confirm(Long id) {
        DeliveryTask task = deliveryTaskRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryTask not found: " + id));
        task.setStatus(DeliveryStatus.CONFIRMED);
        task.setConfirmedAt(LocalDateTime.now());
        return toResponse(deliveryTaskRepo.save(task));
    }

    @Override
    public DeliveryTaskResponseDTO markDelivered(Long id) {
        DeliveryTask task = deliveryTaskRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DeliveryTask not found: " + id));
        task.setStatus(DeliveryStatus.DELIVERED);
        task.setDeliveredAt(LocalDateTime.now());
        return toResponse(deliveryTaskRepo.save(task));
    }

    @Override
    public void delete(Long id) {
        if (!deliveryTaskRepo.existsById(id)) {
            throw new ResourceNotFoundException("DeliveryTask not found: " + id);
        }
        deliveryTaskRepo.deleteById(id);
    }

    private DeliveryTaskResponseDTO toResponse(DeliveryTask task) {
        String patientCode = null;
        String patientFullName = null;
        if (task.getPatientId() != null) {
            patientRepository.findById(task.getPatientId()).ifPresent(p -> {
            });
            Patient p = patientRepository.findById(task.getPatientId()).orElse(null);
            if (p != null) {
                patientCode = p.getPatientCode();
                patientFullName = p.getFirstName() + " " + p.getLastName();
            }
        }

        String staffUsername = null;
        String staffFullName = null;
        if (task.getAssignedStaffId() != null) {
            StaffProfile s = staffProfileRepo.findById(task.getAssignedStaffId()).orElse(null);
            if (s != null) {
                staffUsername = s.getUsername();
                staffFullName = s.getFullName();
            }
        }

        return DeliveryTaskResponseDTO.builder()
                .id(task.getId())
                .patientCode(patientCode)
                .patientFullName(patientFullName)
                .deliveryDate(task.getDeliveryDate())
                .plannedTime(task.getPlannedTime())
                .status(task.getStatus())
                .assignedStaffUsername(staffUsername)
                .assignedStaffFullName(staffFullName)
                .confirmedAt(task.getConfirmedAt())
                .deliveredAt(task.getDeliveredAt())
                .notes(task.getNotes())
                .build();
    }
}
