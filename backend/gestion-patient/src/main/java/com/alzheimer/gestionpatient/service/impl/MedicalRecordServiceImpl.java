package com.alzheimer.gestionpatient.service.impl;

import com.alzheimer.gestionpatient.dto.MedicalRecordDTO;
import com.alzheimer.gestionpatient.entity.MedicalRecord;
import com.alzheimer.gestionpatient.entity.Patient;
import com.alzheimer.gestionpatient.repository.MedicalRecordRepository;
import com.alzheimer.gestionpatient.repository.PatientRepository;
import com.alzheimer.gestionpatient.service.interfaces.IMedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MedicalRecordServiceImpl implements IMedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;

    @Override
    public List<MedicalRecord> getAllMedicalRecords() {
        return medicalRecordRepository.findAll();
    }

    @Override
    public MedicalRecord addMedicalRecord(MedicalRecordDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found with id: " + dto.getPatientId()));

        MedicalRecord record = new MedicalRecord();
        record.setDiagnosis(dto.getDiagnosis());
        record.setDiseaseStage(dto.getDiseaseStage());
        record.setMedicalHistory(dto.getMedicalHistory());
        record.setAllergies(dto.getAllergies());
        record.setLastUpdate(new Date());
        record.setPatient(patient);

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        try {
            if (dto.getRecordDate() != null && !dto.getRecordDate().isEmpty()) {
                record.setRecordDate(sdf.parse(dto.getRecordDate()));
            }
        } catch (ParseException e) {
            throw new RuntimeException("Invalid date format. Use yyyy-MM-dd", e);
        }

        return medicalRecordRepository.save(record);
    }

    @Override
    public MedicalRecord updateMedicalRecord(MedicalRecord medicalRecord) {
        medicalRecord.setLastUpdate(new Date());
        return medicalRecordRepository.save(medicalRecord);
    }

    @Override
    public void deleteMedicalRecord(Integer id) {
        medicalRecordRepository.deleteById(id);
    }

    @Override
    public MedicalRecord getMedicalRecordById(Integer id) {
        return medicalRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical record not found with id: " + id));
    }
}
