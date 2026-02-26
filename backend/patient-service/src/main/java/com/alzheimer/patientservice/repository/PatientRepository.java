package com.alzheimer.patientservice.repository;

import com.alzheimer.patientservice.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    java.util.Optional<Patient> findByKeycloakId(String keycloakId);
}
