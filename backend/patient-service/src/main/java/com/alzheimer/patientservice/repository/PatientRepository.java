package com.alzheimer.patientservice.repository;

import com.alzheimer.patientservice.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
<<<<<<< HEAD
=======
    java.util.Optional<Patient> findByKeycloakId(String keycloakId);
    
    // NEW: Query by user_id
    java.util.Optional<Patient> findByUserId(Long userId);
    
    boolean existsByUserId(Long userId);
>>>>>>> cb099be (user ui update)
}
