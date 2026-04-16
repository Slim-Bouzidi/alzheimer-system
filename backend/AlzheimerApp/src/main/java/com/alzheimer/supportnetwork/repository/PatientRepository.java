package com.alzheimer.supportnetwork.repository;

import com.alzheimer.supportnetwork.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository("supportNetworkPatientRepository")
public interface PatientRepository extends JpaRepository<Patient, Long> {
}
