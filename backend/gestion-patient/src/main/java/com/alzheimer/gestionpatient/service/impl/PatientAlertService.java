package com.alzheimer.gestionpatient.service.impl;

import com.alzheimer.gestionpatient.entity.EmergencyContact;
import com.alzheimer.gestionpatient.entity.MedicalRecord;
import com.alzheimer.gestionpatient.entity.Patient;
import com.alzheimer.gestionpatient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientAlertService {

    private final PatientRepository patientRepository;
    private final EmailService emailService;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void monitorCriticalPatients() {
        List<Patient> patients = patientRepository.findAll();
        for (Patient patient : patients) {
            if (!patient.isAlertSent() && isCritical(patient)) {
                sendAlertToContacts(patient);
                patient.setAlertSent(true);
                patientRepository.save(patient);
            }
        }
    }

    private boolean isCritical(Patient patient) {
        if (!isHighRiskStatus(patient.getStatus())) {
            return false;
        }
        if (patient.getMedicalRecords() == null) {
            return false;
        }

        for (MedicalRecord record : patient.getMedicalRecords()) {
            if (record != null && "ADVANCED".equalsIgnoreCase(record.getDiseaseStage())) {
                return true;
            }
        }
        return false;
    }

    private boolean isHighRiskStatus(String status) {
        if (status == null) {
            return false;
        }
        String normalized = status.trim().toUpperCase();
        return "HIGH".equals(normalized)
                || "HIGH-RISK".equals(normalized)
                || "HIGH_RISK".equals(normalized)
                || "CRITICAL".equals(normalized);
    }

    private void sendAlertToContacts(Patient patient) {
        if (patient.getEmergencyContacts() == null) {
            return;
        }
        String subject = "ALERT: Critical Patient - " + patient.getFirstName() + " " + patient.getLastName();
        String text = "Patient " + patient.getFirstName() + " " + patient.getLastName()
                + " has been identified as critical.\n"
                + "Status: " + patient.getStatus() + "\n"
                + "Please take immediate action.";

        for (EmergencyContact contact : patient.getEmergencyContacts()) {
            if (contact.getEmail() != null && !contact.getEmail().isEmpty()) {
                try {
                    emailService.sendAlertEmail(contact.getEmail(), subject, text);
                    log.info("Alert email sent to {} for patient {}", contact.getEmail(), patient.getIdPatient());
                } catch (Exception e) {
                    log.error("Failed to send alert email to {}: {}", contact.getEmail(), e.getMessage());
                }
            }
        }
    }
}
