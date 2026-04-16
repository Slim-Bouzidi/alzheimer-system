package org.example.alzheimerapp.services.interfaces;

import org.example.alzheimerapp.entities.MedicalRecord;

import java.util.List;

public interface IMedicalRecordService {

    List<MedicalRecord> getAllMedicalRecords();

    MedicalRecord addMedicalRecord(MedicalRecord medicalRecord);

    MedicalRecord updateMedicalRecord(MedicalRecord medicalRecord);

    void deleteMedicalRecord(Integer id);

    MedicalRecord getMedicalRecordById(Integer id);
}

