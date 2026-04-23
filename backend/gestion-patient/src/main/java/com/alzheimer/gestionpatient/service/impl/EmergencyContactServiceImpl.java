package com.alzheimer.gestionpatient.service.impl;

import com.alzheimer.gestionpatient.dto.EmergencyContactDTO;
import com.alzheimer.gestionpatient.entity.EmergencyContact;
import com.alzheimer.gestionpatient.entity.Patient;
import com.alzheimer.gestionpatient.repository.EmergencyContactRepository;
import com.alzheimer.gestionpatient.repository.PatientRepository;
import com.alzheimer.gestionpatient.service.interfaces.IEmergencyContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EmergencyContactServiceImpl implements IEmergencyContactService {

    private final EmergencyContactRepository emergencyContactRepository;
    private final PatientRepository patientRepository;

    @Override
    public List<EmergencyContact> getAllEmergencyContacts() {
        return emergencyContactRepository.findAll();
    }

    @Override
    public EmergencyContact addEmergencyContact(EmergencyContactDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found with id: " + dto.getPatientId()));

        EmergencyContact contact = new EmergencyContact();
        contact.setFullName(dto.getFullName());
        contact.setRelationship(dto.getRelationship());
        contact.setPhone(dto.getPhone());
        contact.setEmail(dto.getEmail());
        contact.setPatient(patient);

        return emergencyContactRepository.save(contact);
    }

    @Override
    public EmergencyContact updateEmergencyContact(EmergencyContact emergencyContact) {
        return emergencyContactRepository.save(emergencyContact);
    }

    @Override
    public void deleteEmergencyContact(Integer id) {
        emergencyContactRepository.deleteById(id);
    }

    @Override
    public EmergencyContact getEmergencyContactById(Integer id) {
        return emergencyContactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Emergency contact not found with id: " + id));
    }
}
