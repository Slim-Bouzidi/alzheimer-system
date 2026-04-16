package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.dto.PatientCreateDto;
import com.alzheimer.supportnetwork.entity.Patient;
import com.alzheimer.supportnetwork.exception.NotFoundException;
import com.alzheimer.supportnetwork.repository.PatientRepository;
import com.alzheimer.supportnetwork.util.GeoUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientService {

    private final PatientRepository repo;

    public PatientService(PatientRepository repo) {
        this.repo = repo;
    }

    public Patient create(PatientCreateDto dto) {
        if (dto.getId() == null) {
            throw new IllegalArgumentException("Patient id is required");
        }
        GeoUtils.validateOptionalCoordinates(dto.getLatitude(), dto.getLongitude());
        Patient p = Patient.builder()
                .id(dto.getId())
                .fullName(dto.getFullName())
                .zone(dto.getZone())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .build();
        return repo.save(p);
    }


    public List<Patient> getAll() {
        return repo.findAll();
    }

    public Patient getById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Patient not found: " + id));
    }

    public Patient update(Long id, PatientCreateDto dto) {
        GeoUtils.validateOptionalCoordinates(dto.getLatitude(), dto.getLongitude());
        Patient p = getById(id);
        p.setFullName(dto.getFullName());
        p.setZone(dto.getZone());
        p.setLatitude(dto.getLatitude());
        p.setLongitude(dto.getLongitude());
        return repo.save(p);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}
