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
    public PatientResponse findByKeycloakId(String keycloakId) {
        return repository.findByKeycloakId(keycloakId)
                .map(PatientMapper::toResponse)
                .orElse(null);
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Override
    public PatientResponse saveOrUpdateByKeycloakId(String keycloakId, PatientRequest request) {
        Patient patient = repository.findByKeycloakId(keycloakId)
                .orElse(new Patient());
        
        patient.setKeycloakId(keycloakId);
        if (patient.getFirstName() == null || patient.getFirstName().isEmpty()) {
            patient.setFirstName(request.getFirstName() != null ? request.getFirstName() : "New");
        }
        if (patient.getLastName() == null || patient.getLastName().isEmpty()) {
            patient.setLastName(request.getLastName() != null ? request.getLastName() : "Patient");
        }
        if (request.getAge() != null) {
            patient.setAge(request.getAge());
        }
        
        // Clinical Metrics
        patient.setBmi(request.getBmi());
        patient.setSystolicBP(request.getSystolicBP());
        patient.setDiastolicBP(request.getDiastolicBP());
        patient.setHeartRate(request.getHeartRate());
        patient.setBloodSugar(request.getBloodSugar());
        patient.setCholesterolTotal(request.getCholesterolTotal());
        patient.setSmokingStatus(request.getSmokingStatus());
        patient.setAlcoholConsumption(request.getAlcoholConsumption());
        patient.setPhysicalActivity(request.getPhysicalActivity());
        patient.setDietQuality(request.getDietQuality());
        patient.setSleepQuality(request.getSleepQuality());
        patient.setFamilyHistory(request.getFamilyHistory());
        patient.setDiabetes(request.getDiabetes());
        patient.setHypertension(request.getHypertension());
        
        return PatientMapper.toResponse(repository.save(patient));
    }

    @Override
    public PatientResponse update(Long id, PatientRequest request) {
        Patient patient = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        
        patient.setFirstName(request.getFirstName());
        patient.setLastName(request.getLastName());
        patient.setAge(request.getAge());
        
        // Clinical Metrics
        patient.setBmi(request.getBmi());
        patient.setSystolicBP(request.getSystolicBP());
        patient.setDiastolicBP(request.getDiastolicBP());
        patient.setHeartRate(request.getHeartRate());
        patient.setBloodSugar(request.getBloodSugar());
        patient.setCholesterolTotal(request.getCholesterolTotal());
        patient.setSmokingStatus(request.getSmokingStatus());
        patient.setAlcoholConsumption(request.getAlcoholConsumption());
        patient.setPhysicalActivity(request.getPhysicalActivity());
        patient.setDietQuality(request.getDietQuality());
        patient.setSleepQuality(request.getSleepQuality());
        patient.setFamilyHistory(request.getFamilyHistory());
        patient.setDiabetes(request.getDiabetes());
        patient.setHypertension(request.getHypertension());
        
        return PatientMapper.toResponse(repository.save(patient));
    }
}
