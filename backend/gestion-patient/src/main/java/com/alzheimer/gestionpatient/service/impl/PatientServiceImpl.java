package com.alzheimer.gestionpatient.service.impl;

import com.alzheimer.gestionpatient.entity.MedicalRecord;
import com.alzheimer.gestionpatient.entity.Patient;
import com.alzheimer.gestionpatient.repository.PatientRepository;
import com.alzheimer.gestionpatient.service.interfaces.IPatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PatientServiceImpl implements IPatientService {

    private final PatientRepository patientRepository;

    @Override
    public List<Patient> getAllPatients() {
        List<Patient> patients = patientRepository.findAll();
        patients.forEach(this::populateRiskData);
        return patients;
    }

    @Override
    public Patient addPatient(Patient patient) {
        patient.setCreatedAt(new Date());
        return patientRepository.save(patient);
    }

    @Override
    public Patient updatePatient(Patient patient) {
        return patientRepository.save(patient);
    }

    @Override
    public void deletePatient(Integer id) {
        patientRepository.deleteById(id);
    }

    @Override
    public Patient getPatientById(Integer id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found with id: " + id));
        populateRiskData(patient);
        return patient;
    }

    @Override
    public List<Patient> getPatientsBySoignant(Long soignantId) {
        List<Patient> patients = patientRepository.findBySoignantId(soignantId);
        patients.forEach(this::populateRiskData);
        return patients;
    }

    @Override
    public List<Patient> getPatientsSortedByStatus() {
        List<Patient> patients = patientRepository.findAllByOrderByStatusAsc();
        patients.forEach(this::populateRiskData);
        return patients;
    }

    private void populateRiskData(Patient patient) {
        int score = calculateRiskScore(patient);
        patient.setRiskScore(score);
        patient.setRiskLevel(getRiskLevel(score));
    }

    private int calculateRiskScore(Patient patient) {
        int score = 0;

        // Status score
        if (patient.getStatus() != null) {
            switch (patient.getStatus().toUpperCase()) {
                case "HIGH":
                    score += 5;
                    break;
                case "SURVEILLANCE":
                    score += 3;
                    break;
                case "STABLE":
                    score += 1;
                    break;
            }
        }

        // Disease stage score from medical records
        if (patient.getMedicalRecords() != null) {
            for (MedicalRecord record : patient.getMedicalRecords()) {
                if (record.getDiseaseStage() != null) {
                    switch (record.getDiseaseStage().toUpperCase()) {
                        case "ADVANCED":
                            score += 5;
                            break;
                        case "MODERATE":
                            score += 3;
                            break;
                        case "MILD":
                            score += 1;
                            break;
                    }
                    break; // use first record's stage
                }
            }
        }

        // Family history
        if (patient.isFamilyHistoryAlzheimer()) {
            score += 3;
        }

        // Age > 65
        if (patient.getDateOfBirth() != null) {
            LocalDate birthDate = Instant.ofEpochMilli(patient.getDateOfBirth().getTime())
                    .atZone(ZoneId.systemDefault()).toLocalDate();
            int age = Period.between(birthDate, LocalDate.now()).getYears();
            if (age > 65) {
                score += 2;
            }
        }

        return score;
    }

    private String getRiskLevel(int score) {
        if (score >= 10) {
            return "HIGH";
        } else if (score >= 5) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }
}
