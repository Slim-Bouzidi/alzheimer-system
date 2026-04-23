package com.alzheimer.gestionpatient.service.interfaces;

import com.alzheimer.gestionpatient.dto.MedicalRecordDTO;
import com.alzheimer.gestionpatient.entity.MedicalRecord;

import java.util.List;

public interface IMedicalRecordService {
    List<MedicalRecord> getAllMedicalRecords();
    MedicalRecord addMedicalRecord(MedicalRecordDTO dto);
    MedicalRecord updateMedicalRecord(MedicalRecord medicalRecord);
    void deleteMedicalRecord(Integer id);
    MedicalRecord getMedicalRecordById(Integer id);
}
