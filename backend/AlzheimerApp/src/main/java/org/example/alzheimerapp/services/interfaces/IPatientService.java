package org.example.alzheimerapp.services.interfaces;

import org.example.alzheimerapp.entities.Patient;

import java.util.List;

public interface IPatientService {

    List<Patient> getAllPatients();

    Patient addPatient(Patient patient);

    Patient updatePatient(Patient patient);

    void deletePatient(Integer id);

    Patient getPatientById(Integer id);

    // ✅ NEW METHOD (patients linked to a specific soignant)
    List<Patient> getPatientsBySoignant(Long soignantId);

    // 🟢 NEW METHOD (sort patients by status)
    List<Patient> getPatientsSortedByStatus();
}