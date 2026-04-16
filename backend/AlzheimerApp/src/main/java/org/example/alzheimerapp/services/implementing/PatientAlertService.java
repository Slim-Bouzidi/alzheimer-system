package org.example.alzheimerapp.services.implementing;

import org.example.alzheimerapp.entities.EmergencyContact;
import org.example.alzheimerapp.entities.MedicalRecord;
import org.example.alzheimerapp.entities.Patient;
import org.example.alzheimerapp.repositories.PatientRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PatientAlertService {

    private final PatientRepository patientRepository;
    private final EmailService emailService;

    public PatientAlertService(PatientRepository patientRepository, EmailService emailService) {
        this.patientRepository = patientRepository;
        this.emailService = emailService;
    }

    /**
     * Executes every 60 seconds (60,000 milliseconds)
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void monitorCriticalPatients() {
        System.out.println("Running scheduled critical patient monitor...");
        List<Patient> allPatients = patientRepository.findAll();

        for (Patient patient : allPatients) {
            boolean critical = isCritical(patient);

            if (critical && !patient.isAlertSent()) {
                // Patient is critical and alert NOT sent yet -> Send it
                sendAlertsForPatient(patient);
                patient.setAlertSent(true);
                patientRepository.save(patient);
            } else if (!critical && patient.isAlertSent()) {
                // Patient is no longer critical, but alert was previously sent -> Reset flag
                System.out.println("Patient " + patient.getFirstName() + " " + patient.getLastName()
                        + " is no longer critical. Resetting alert flag.");
                patient.setAlertSent(false);
                patientRepository.save(patient);
            }
        }
    }

    private boolean isCritical(Patient patient) {
        // Condition 1: patient.status == "HIGH" (checking ignoring case to handle
        // "high-risk" or "high" variations)
        boolean hasHighStatus = patient.getStatus() != null &&
                (patient.getStatus().equalsIgnoreCase("HIGH") || patient.getStatus().equalsIgnoreCase("HIGH-RISK"));

        // Condition 2: patient.familyHistoryAlzheimer == true
        boolean hasFamilyHistory = patient.isFamilyHistoryAlzheimer();

        // Condition 3: patient.medicalRecord.diseaseStage == "ADVANCED"
        // Since a patient can have multiple medical records, we check if ANY of them
        // are advanced
        boolean hasAdvancedDisease = false;
        if (patient.getMedicalRecords() != null) {
            for (MedicalRecord record : patient.getMedicalRecords()) {
                if (record.getDiseaseStage() != null && record.getDiseaseStage().equalsIgnoreCase("ADVANCED")) {
                    hasAdvancedDisease = true;
                    break;
                }
            }
        }

        return hasHighStatus && hasFamilyHistory && hasAdvancedDisease;
    }

    private void sendAlertsForPatient(Patient patient) {
        System.out.println("CRITICAL PATIENT DETECTED: " + patient.getFirstName() + " " + patient.getLastName());

        List<EmergencyContact> contacts = patient.getEmergencyContacts();
        if (contacts == null || contacts.isEmpty()) {
            System.out.println("No emergency contacts found for patient ID " + patient.getIdPatient() + ".");
            return;
        }

        String subject = "Critical Patient Alert - Immediate Attention Required";
        String body = String.format(
                "The patient %s %s is currently in a critical condition.\n\n" +
                        "Status: %s\n" +
                        "Disease Stage: ADVANCED\n\n" +
                        "Please contact the medical center immediately.",
                patient.getFirstName(),
                patient.getLastName(),
                patient.getStatus());

        for (EmergencyContact contact : contacts) {
            if (contact.getEmail() != null && !contact.getEmail().trim().isEmpty()) {
                emailService.sendAlertEmail(contact.getEmail(), subject, body);
            } else {
                System.out.println("Contact " + contact.getFullName() + " has no email address. Skipping email.");
            }
        }
    }
}
