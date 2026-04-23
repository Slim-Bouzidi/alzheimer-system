package com.alzheimer.gestionlivreur.service.impl;

import com.alzheimer.gestionlivreur.dto.StaffProfileRequestDTO;
import com.alzheimer.gestionlivreur.dto.StaffProfileResponseDTO;
import com.alzheimer.gestionlivreur.entity.StaffProfile;
import com.alzheimer.gestionlivreur.exception.ResourceNotFoundException;
import com.alzheimer.gestionlivreur.repository.StaffProfileRepo;
import com.alzheimer.gestionlivreur.service.interfaces.IStaffProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffProfileServiceImpl implements IStaffProfileService {

    private final StaffProfileRepo staffProfileRepo;

    @Override
    public StaffProfileResponseDTO create(StaffProfileRequestDTO request) {
        if (staffProfileRepo.findByUsernameIgnoreCase(request.getUsername()).isPresent()) {
            throw new IllegalStateException("Username already exists: " + request.getUsername());
        }

        StaffProfile staff = StaffProfile.builder()
                .username(request.getUsername())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        return toResponse(staffProfileRepo.save(staff));
    }

    @Override
    public StaffProfileResponseDTO update(Long id, StaffProfileRequestDTO request) {
        StaffProfile staff = staffProfileRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + id));

        // Check if username is being changed to one that already exists
        if (!staff.getUsername().equalsIgnoreCase(request.getUsername())) {
            if (staffProfileRepo.findByUsernameIgnoreCase(request.getUsername()).isPresent()) {
                throw new IllegalStateException("Username already exists: " + request.getUsername());
            }
        }

        staff.setUsername(request.getUsername());
        staff.setFullName(request.getFullName());
        staff.setPhone(request.getPhone());
        if (request.getActive() != null) staff.setActive(request.getActive());

        return toResponse(staffProfileRepo.save(staff));
    }

    @Override
    public StaffProfileResponseDTO getById(Long id) {
        return toResponse(staffProfileRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + id)));
    }

    @Override
    public List<StaffProfileResponseDTO> getAll() {
        return staffProfileRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<StaffProfileResponseDTO> getActive() {
        return staffProfileRepo.findByActiveTrue().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<StaffProfileResponseDTO> searchByName(String query) {
        return staffProfileRepo.findByFullNameContainingIgnoreCase(query).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public StaffProfileResponseDTO deactivate(Long id) {
        StaffProfile staff = staffProfileRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + id));
        staff.setActive(false);
        return toResponse(staffProfileRepo.save(staff));
    }

    @Override
    public void delete(Long id) {
        if (!staffProfileRepo.existsById(id)) {
            throw new ResourceNotFoundException("Staff not found: " + id);
        }
        staffProfileRepo.deleteById(id);
    }

    private StaffProfileResponseDTO toResponse(StaffProfile staff) {
        return StaffProfileResponseDTO.builder()
                .id(staff.getId())
                .username(staff.getUsername())
                .fullName(staff.getFullName())
                .phone(staff.getPhone())
                .active(staff.getActive())
                .build();
    }
}
