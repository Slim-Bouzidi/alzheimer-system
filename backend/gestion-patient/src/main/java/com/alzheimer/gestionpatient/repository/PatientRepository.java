package com.alzheimer.gestionpatient.repository;

import com.alzheimer.gestionpatient.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Integer> {
    List<Patient> findBySoignantId(Long soignantId);
    List<Patient> findAllByOrderByStatusAsc();
}
