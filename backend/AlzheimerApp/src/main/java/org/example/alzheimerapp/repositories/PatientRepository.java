package org.example.alzheimerapp.repositories;

import org.example.alzheimerapp.entities.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Integer> {

    // 🔴 THIS IS THE NEW METHOD
    List<Patient> findBySoignantId(Long soignantId);

    // 🟢 NEW: Find all patients sorted by status ascending
    List<Patient> findAllByOrderByStatusAsc();
}