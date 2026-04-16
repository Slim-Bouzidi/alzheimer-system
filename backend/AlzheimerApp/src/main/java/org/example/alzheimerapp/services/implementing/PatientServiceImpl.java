package org.example.alzheimerapp.services.implementing;

import org.example.alzheimerapp.entities.Patient;
import org.example.alzheimerapp.repositories.PatientRepository;
import org.example.alzheimerapp.services.interfaces.IPatientService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientServiceImpl implements IPatientService {

    private final PatientRepository patientRepository;

    public PatientServiceImpl(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Override
    public List<Patient> getAllPatients() {
        List<Patient> patients = patientRepository.findAll();
        patients.forEach(this::populateRiskData);
        return patients;
    }

    @Override
    public Patient addPatient(Patient patient) {
        return patientRepository.save(patient);
    }

    @Override
    public Patient updatePatient(Patient patient) {
        Patient savedPatient = patientRepository.save(patient);
        populateRiskData(savedPatient);
        return savedPatient;
    }

    @Override
    public void deletePatient(Integer id) {
        patientRepository.deleteById(id);
    }

    @Override
    public Patient getPatientById(Integer id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found with id " + id));
        populateRiskData(patient);
        return patient;
    }

    // ✅ NEW METHOD: get patients assigned to a specific soignant
    @Override
    public List<Patient> getPatientsBySoignant(Long soignantId) {
        List<Patient> patients = patientRepository.findBySoignantId(soignantId);
        patients.forEach(this::populateRiskData);
        return patients;
    }

    // 🟢 NEW METHOD: get all patients sorted by status ascending
    @Override
    public List<Patient> getPatientsSortedByStatus() {
        List<Patient> patients = patientRepository.findAllByOrderByStatusAsc();
        patients.forEach(this::populateRiskData);
        return patients;
    }

    // --- Alzheimer Risk Score AI Logic ---

    private void populateRiskData(Patient patient) {
        int score = calculateRiskScore(patient);
        patient.setRiskScore(score);
        patient.setRiskLevel(getRiskLevel(score));
    }

    private int calculateRiskScore(Patient patient) {
        int score = 0;

        // Rule 1: patient.status -> High Risk = +5, Surveillance = +3, Stable = +1
        if (patient.getStatus() != null) {
            String status = patient.getStatus().toLowerCase();
            if (status.contains("high") || status.contains("risk")) {
                score += 5;
            } else if (status.contains("surveillance") || status.contains("attention")) {
                score += 3;
            } else if (status.contains("stable")) {
                score += 1;
            }
        }

        // Rule 2: medicalRecord.diseaseStage -> Advanced = +5, Moderate = +3, Mild = +1
        // Finds the highest impact stage across all records
        if (patient.getMedicalRecords() != null && !patient.getMedicalRecords().isEmpty()) {
            int maxDiseaseScore = 0;
            for (var record : patient.getMedicalRecords()) {
                if (record.getDiseaseStage() != null) {
                    String stage = record.getDiseaseStage().toLowerCase();
                    if (stage.contains("advanced") || stage.contains("severe")) {
                        maxDiseaseScore = Math.max(maxDiseaseScore, 5);
                    } else if (stage.contains("moderate")) {
                        maxDiseaseScore = Math.max(maxDiseaseScore, 3);
                    } else if (stage.contains("mild") || stage.contains("early")) {
                        maxDiseaseScore = Math.max(maxDiseaseScore, 1);
                    }
                }
            }
            score += maxDiseaseScore;
        }

        // Rule 3: patient.familyHistoryAlzheimer == true -> +3 points
        if (patient.isFamilyHistoryAlzheimer()) {
            score += 3;
        }

        // Rule 4: patient age > 65 years -> +2 points
        if (patient.getDateOfBirth() != null) {
            long ageInMillis = new java.util.Date().getTime() - patient.getDateOfBirth().getTime();
            long ageInYears = ageInMillis / (1000L * 60 * 60 * 24 * 365);
            if (ageInYears > 65) {
                score += 2;
            }
        }

        return score;
    }

    private String getRiskLevel(int score) {
        if (score >= 10)
            return "HIGH";
        if (score >= 5)
            return "MEDIUM";
        return "LOW";
    }
}