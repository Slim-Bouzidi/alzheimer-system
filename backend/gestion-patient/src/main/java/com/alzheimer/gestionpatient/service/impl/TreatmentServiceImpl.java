package com.alzheimer.gestionpatient.service.impl;

import com.alzheimer.gestionpatient.dto.TreatmentDTO;
import com.alzheimer.gestionpatient.entity.Patient;
import com.alzheimer.gestionpatient.entity.Treatment;
import com.alzheimer.gestionpatient.repository.PatientRepository;
import com.alzheimer.gestionpatient.repository.TreatmentRepository;
import com.alzheimer.gestionpatient.service.interfaces.ITreatmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TreatmentServiceImpl implements ITreatmentService {

    private final TreatmentRepository treatmentRepository;
    private final PatientRepository patientRepository;

    @Override
    public List<Treatment> getAllTreatments() {
        return treatmentRepository.findAll();
    }

    @Override
    public Treatment addTreatment(TreatmentDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found with id: " + dto.getPatientId()));

        Treatment treatment = new Treatment();
        treatment.setTreatmentName(dto.getTreatmentName());
        treatment.setDosage(dto.getDosage());
        treatment.setFrequency(dto.getFrequency());
        treatment.setStatus(dto.getStatus());
        treatment.setPatient(patient);

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        try {
            if (dto.getStartDate() != null && !dto.getStartDate().isEmpty()) {
                treatment.setStartDate(sdf.parse(dto.getStartDate()));
            }
            if (dto.getEndDate() != null && !dto.getEndDate().isEmpty()) {
                treatment.setEndDate(sdf.parse(dto.getEndDate()));
            }
        } catch (ParseException e) {
            throw new RuntimeException("Invalid date format. Use yyyy-MM-dd", e);
        }

        return treatmentRepository.save(treatment);
    }

    @Override
    public Treatment updateTreatment(Treatment treatment) {
        return treatmentRepository.save(treatment);
    }

    @Override
    public void deleteTreatment(Integer id) {
        treatmentRepository.deleteById(id);
    }

    @Override
    public Treatment getTreatmentById(Integer id) {
        return treatmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Treatment not found with id: " + id));
    }
}
