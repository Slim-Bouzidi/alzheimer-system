package com.alzheimer.gestionlivreur.service.impl;

import com.alzheimer.gestionlivreur.dto.AssignmentRequestDTO;
import com.alzheimer.gestionlivreur.dto.AssignmentResponseDTO;
import com.alzheimer.gestionlivreur.entity.Assignment;
import com.alzheimer.gestionlivreur.entity.Patient;
import com.alzheimer.gestionlivreur.entity.StaffProfile;
import com.alzheimer.gestionlivreur.exception.ResourceNotFoundException;
import com.alzheimer.gestionlivreur.repository.AssignmentRepo;
import com.alzheimer.gestionlivreur.repository.PatientRepository;
import com.alzheimer.gestionlivreur.repository.StaffProfileRepo;
import com.alzheimer.gestionlivreur.service.interfaces.IAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements IAssignmentService {

    private final AssignmentRepo assignmentRepo;
    private final StaffProfileRepo staffProfileRepo;
    private final PatientRepository patientRepository;

    @Override
    public AssignmentResponseDTO create(AssignmentRequestDTO request) {
        StaffProfile staff = staffProfileRepo.findByUsernameIgnoreCase(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + request.getUsername()));
        Patient patient = patientRepository.findByPatientCodeIgnoreCase(request.getPatientCode())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + request.getPatientCode()));

        if (assignmentRepo.existsByStaff_IdAndPatient_IdAndActiveTrue(staff.getId(), patient.getId())) {
            throw new IllegalStateException("Active assignment already exists for this staff-patient pair");
        }

        Assignment assignment = Assignment.builder()
                .staff(staff)
                .patient(patient)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .active(true)
                .build();

        return toResponse(assignmentRepo.save(assignment));
    }

    @Override
    public AssignmentResponseDTO update(Long id, AssignmentRequestDTO request) {
        Assignment assignment = assignmentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found: " + id));

        StaffProfile staff = staffProfileRepo.findByUsernameIgnoreCase(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + request.getUsername()));
        Patient patient = patientRepository.findByPatientCodeIgnoreCase(request.getPatientCode())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + request.getPatientCode()));

        assignment.setStaff(staff);
        assignment.setPatient(patient);
        assignment.setStartDate(request.getStartDate());
        assignment.setEndDate(request.getEndDate());

        return toResponse(assignmentRepo.save(assignment));
    }

    @Override
    public AssignmentResponseDTO getById(Long id) {
        return toResponse(assignmentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found: " + id)));
    }

    @Override
    public List<AssignmentResponseDTO> getAll() {
        return assignmentRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<AssignmentResponseDTO> getByStaff(String username, boolean activeOnly) {
        StaffProfile staff = staffProfileRepo.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + username));
        List<Assignment> list = activeOnly
                ? assignmentRepo.findByStaff_IdAndActiveTrue(staff.getId())
                : assignmentRepo.findByStaff_Id(staff.getId());
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<AssignmentResponseDTO> getByPatient(String patientCode, boolean activeOnly) {
        Patient patient = patientRepository.findByPatientCodeIgnoreCase(patientCode)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientCode));
        List<Assignment> list = activeOnly
                ? assignmentRepo.findByPatient_IdAndActiveTrue(patient.getId())
                : assignmentRepo.findByPatient_Id(patient.getId());
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public AssignmentResponseDTO deactivate(Long id) {
        Assignment assignment = assignmentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found: " + id));
        assignment.setActive(false);
        return toResponse(assignmentRepo.save(assignment));
    }

    @Override
    public void delete(Long id) {
        if (!assignmentRepo.existsById(id)) {
            throw new ResourceNotFoundException("Assignment not found: " + id);
        }
        assignmentRepo.deleteById(id);
    }

    private AssignmentResponseDTO toResponse(Assignment a) {
        return AssignmentResponseDTO.builder()
                .id(a.getId())
                .username(a.getStaff().getUsername())
                .staffFullName(a.getStaff().getFullName())
                .patientCode(a.getPatient().getPatientCode())
                .patientFullName(a.getPatient().getFirstName() + " " + a.getPatient().getLastName())
                .startDate(a.getStartDate())
                .endDate(a.getEndDate())
                .active(a.getActive())
                .build();
    }
}
