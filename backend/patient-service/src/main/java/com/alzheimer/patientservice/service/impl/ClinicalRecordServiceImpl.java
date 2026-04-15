package com.alzheimer.patientservice.service.impl;

import com.alzheimer.patientservice.dto.ClinicalRecordRequest;
import com.alzheimer.patientservice.dto.ClinicalRecordResponse;
import com.alzheimer.patientservice.entity.ClinicalRecord;
import com.alzheimer.patientservice.entity.Patient;
import com.alzheimer.patientservice.exception.ResourceNotFoundException;
import com.alzheimer.patientservice.mapper.ClinicalRecordMapper;
import com.alzheimer.patientservice.repository.ClinicalRecordRepository;
import com.alzheimer.patientservice.repository.PatientRepository;
import com.alzheimer.patientservice.service.ClinicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClinicalRecordServiceImpl implements ClinicalRecordService {

    private final ClinicalRecordRepository repository;
    private final PatientRepository patientRepository;

    @Override
    public ClinicalRecordResponse create(ClinicalRecordRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        
        ClinicalRecord record = ClinicalRecordMapper.toEntity(request, patient);
        return ClinicalRecordMapper.toResponse(repository.save(record));
    }

    @Override
    public List<ClinicalRecordResponse> findByPatientId(Long patientId) {
        return repository.findByPatientIdOrderByRecordedAtDesc(patientId)
                .stream()
                .map(ClinicalRecordMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ClinicalRecordResponse> findMyRecords(String keycloakId) {
        return repository.findByPatientKeycloakIdOrderByRecordedAtDesc(keycloakId)
                .stream()
                .map(ClinicalRecordMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ClinicalRecordResponse update(Long id, ClinicalRecordRequest request) {
        ClinicalRecord record = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Clinical record not found"));
        
        record.setBmi(request.getBmi());
        record.setSystolicBP(request.getSystolicBP());
        record.setDiastolicBP(request.getDiastolicBP());
        record.setHeartRate(request.getHeartRate());
        record.setBloodSugar(request.getBloodSugar());
        record.setCholesterolTotal(request.getCholesterolTotal());
        record.setSmokingStatus(request.getSmokingStatus());
        record.setAlcoholConsumption(request.getAlcoholConsumption());
        record.setPhysicalActivity(request.getPhysicalActivity());
        record.setDietQuality(request.getDietQuality());
        record.setSleepQuality(request.getSleepQuality());
        record.setFamilyHistory(request.getFamilyHistory());
        record.setDiabetes(request.getDiabetes());
        record.setHypertension(request.getHypertension());
        
        return ClinicalRecordMapper.toResponse(repository.save(record));
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Clinical record not found");
        }
        repository.deleteById(id);
    }
}
