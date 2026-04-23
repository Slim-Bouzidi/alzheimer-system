package com.alzheimer.gestionpatient.service.interfaces;

import com.alzheimer.gestionpatient.entity.Patient;

import java.util.List;

public interface IPatientService {
    List<Patient> getAllPatients();
    Patient addPatient(Patient patient);
    Patient updatePatient(Patient patient);
    void deletePatient(Integer id);
    Patient getPatientById(Integer id);
    List<Patient> getPatientsBySoignant(Long soignantId);
    List<Patient> getPatientsSortedByStatus();
}
