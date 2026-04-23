package com.alzheimer.gestionlivreur.service.impl;

import com.alzheimer.gestionlivreur.dto.PatientRequest;
import com.alzheimer.gestionlivreur.dto.PatientResponse;
import com.alzheimer.gestionlivreur.entity.Patient;
import com.alzheimer.gestionlivreur.entity.RouteStop;
import com.alzheimer.gestionlivreur.entity.StopStatus;
import com.alzheimer.gestionlivreur.exception.ResourceNotFoundException;
import com.alzheimer.gestionlivreur.mapper.PatientMapper;
import com.alzheimer.gestionlivreur.repository.*;
import com.alzheimer.gestionlivreur.service.interfaces.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final PatientMapper patientMapper;
    private final AssignmentRepo assignmentRepo;
    private final RouteStopRepo routeStopRepo;
    private final DeliveryTaskRepo deliveryTaskRepo;

    private static final double DEFAULT_LAT = 36.8065;
    private static final double DEFAULT_LNG = 10.1815;

    @Override
    public PatientResponse create(PatientRequest request) {
        Patient patient = patientMapper.toEntity(request);
        if (patient.getLatitude() == null) patient.setLatitude(DEFAULT_LAT);
        if (patient.getLongitude() == null) patient.setLongitude(DEFAULT_LNG);
        return patientMapper.toResponse(patientRepository.save(patient));
    }

    @Override
    public List<PatientResponse> findAll() {
        return patientRepository.findAll().stream()
                .map(patientMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PatientResponse findById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));
        return patientMapper.toResponse(patient);
    }

    @Override
    public PatientResponse update(Long id, PatientRequest request) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));

        patient.setPatientCode(request.getPatientCode());
        patient.setFirstName(request.getFirstName());
        patient.setLastName(request.getLastName());
        patient.setAge(request.getAge());
        patient.setLatitude(request.getLatitude() != null ? request.getLatitude() : DEFAULT_LAT);
        patient.setLongitude(request.getLongitude() != null ? request.getLongitude() : DEFAULT_LNG);

        Patient saved = patientRepository.save(patient);

        // Sync coordinates to pending route stops
        List<RouteStop> pendingStops = routeStopRepo.findByPatientId(id).stream()
                .filter(s -> s.getStatus() == StopStatus.PENDING)
                .collect(Collectors.toList());
        pendingStops.forEach(stop -> {
            stop.setLatitude(saved.getLatitude());
            stop.setLongitude(saved.getLongitude());
        });
        if (!pendingStops.isEmpty()) {
            routeStopRepo.saveAll(pendingStops);
        }

        return patientMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!patientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Patient not found with id: " + id);
        }
        assignmentRepo.deleteByPatientId(id);
        routeStopRepo.deleteByPatientId(id);
        deliveryTaskRepo.deleteByPatientId(id);
        patientRepository.deleteById(id);
    }
}
