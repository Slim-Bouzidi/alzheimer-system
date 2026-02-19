package com.alzheimer.patientservice.service.impl;

import com.alzheimer.patientservice.dto.PatientRequest;
import com.alzheimer.patientservice.dto.PatientResponse;
import com.alzheimer.patientservice.entity.Patient;
import com.alzheimer.patientservice.exception.ResourceNotFoundException;
import com.alzheimer.patientservice.mapper.PatientMapper;
import com.alzheimer.patientservice.repository.PatientRepository;
import com.alzheimer.patientservice.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository repository;

    @Override
    public PatientResponse create(PatientRequest request) {
        Patient patient = PatientMapper.toEntity(request);
        return PatientMapper.toResponse(repository.save(patient));
    }

    @Override
    public List<PatientResponse> findAll() {
        return repository.findAll()
                .stream()
                .map(PatientMapper::toResponse)
                .toList();
    }

    @Override
    public PatientResponse findById(Long id) {
        Patient patient = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        return PatientMapper.toResponse(patient);
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
