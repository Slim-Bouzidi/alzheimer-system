package org.example.alzheimerapp.services.implementing;

import org.example.alzheimerapp.entities.MedicalRecord;
import org.example.alzheimerapp.repositories.MedicalRecordRepository;
import org.example.alzheimerapp.services.interfaces.IMedicalRecordService;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MedicalRecordServiceImpl implements IMedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;

    public MedicalRecordServiceImpl(MedicalRecordRepository medicalRecordRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
    }

    @Override
    public List<MedicalRecord> getAllMedicalRecords() {
        return medicalRecordRepository.findAll();
    }

    @Override
    public MedicalRecord addMedicalRecord(MedicalRecord medicalRecord) {
        return medicalRecordRepository.save(medicalRecord);
    }

    @Override
    public MedicalRecord updateMedicalRecord(MedicalRecord medicalRecord) {
        return medicalRecordRepository.save(medicalRecord);
    }

    @Transactional
    @Override
    public void deleteMedicalRecord(Integer id) {
        MedicalRecord record = medicalRecordRepository.findById(id).orElseThrow();
        if (record.getPatient() != null && record.getPatient().getMedicalRecords() != null) {
            record.getPatient().getMedicalRecords().removeIf(r -> r.getIdRecord().equals(id));
        }
        medicalRecordRepository.delete(record);
    }

    @Override
    public MedicalRecord getMedicalRecordById(Integer id) {
        return medicalRecordRepository.findById(id).orElseThrow();
    }
}
