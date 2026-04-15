package com.alzheimer.patientservice.service.impl;

import com.alzheimer.patientservice.dto.PatientRequest;
import com.alzheimer.patientservice.dto.PatientResponse;
import com.alzheimer.patientservice.dto.UserResponse;
import com.alzheimer.patientservice.entity.Patient;
import com.alzheimer.patientservice.exception.ResourceNotFoundException;
import com.alzheimer.patientservice.exception.ServiceCommunicationException;
import com.alzheimer.patientservice.exception.ValidationException;
import com.alzheimer.patientservice.mapper.PatientMapper;
import com.alzheimer.patientservice.repository.PatientRepository;
import com.alzheimer.patientservice.service.PatientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientServiceImpl implements PatientService {

    private final PatientRepository repository;
    private final RestTemplate restTemplate;
    
    @Value("${user.service.url}")
    private String userServiceUrl;

    /**
     * Validates that a user exists in the User Service
     * @param userId the user ID to validate
     * @throws ValidationException if user doesn't exist
     * @throws ServiceCommunicationException if unable to communicate with User Service
     */
    private void validateUserExists(Long userId) {
        if (userId == null) {
            throw new ValidationException("user_id is required");
        }
        
        try {
            String url = userServiceUrl + "/api/users/" + userId;
            ResponseEntity<UserResponse> response = restTemplate.getForEntity(url, UserResponse.class);
            
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new ValidationException("Invalid user_id: user does not exist");
            }
        } catch (RestClientException e) {
            log.error("Failed to validate user existence for userId: {}", userId, e);
            throw new ServiceCommunicationException("Unable to validate user", e);
        }
    }

    @Override
    public PatientResponse create(PatientRequest request) {
        // Validate that userId is provided
        if (request.getUserId() == null) {
            throw new ValidationException("user_id is required");
        }
        
        // Note: User existence is enforced by foreign key constraint at database level
        // No need to call User Service for validation
        
        Patient patient = PatientMapper.toEntity(request);
        
        // If keycloakId is not provided, generate a unique one for backward compatibility
        if (patient.getKeycloakId() == null || patient.getKeycloakId().isEmpty()) {
            patient.setKeycloakId(java.util.UUID.randomUUID().toString());
        }
        
        try {
            return PatientMapper.toResponse(repository.save(patient));
        } catch (Exception e) {
            // If foreign key constraint fails, throw validation exception
            if (e.getMessage() != null && e.getMessage().contains("foreign key constraint")) {
                throw new ValidationException("Invalid user_id: user does not exist");
            }
            throw e;
        }
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
    public PatientResponse findByUserId(Long userId) {
        return repository.findByUserId(userId)
                .map(PatientMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with userId: " + userId));
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
