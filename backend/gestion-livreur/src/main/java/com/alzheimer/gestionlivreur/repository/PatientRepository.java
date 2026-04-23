package com.alzheimer.gestionlivreur.repository;

import com.alzheimer.gestionlivreur.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByPatientCodeIgnoreCase(String patientCode);
}
