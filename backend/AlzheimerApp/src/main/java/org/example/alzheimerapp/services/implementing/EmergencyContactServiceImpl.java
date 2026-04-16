package org.example.alzheimerapp.services.implementing;

import org.example.alzheimerapp.entities.EmergencyContact;
import org.example.alzheimerapp.repositories.EmergencyContactRepository;
import org.example.alzheimerapp.services.interfaces.IEmergencyContactService;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class EmergencyContactServiceImpl implements IEmergencyContactService {

    private final EmergencyContactRepository emergencyContactRepository;

    public EmergencyContactServiceImpl(EmergencyContactRepository emergencyContactRepository) {
        this.emergencyContactRepository = emergencyContactRepository;
    }

    @Override
    public List<EmergencyContact> getAllEmergencyContacts() {
        return emergencyContactRepository.findAll();
    }

    @Override
    public EmergencyContact addEmergencyContact(EmergencyContact contact) {
        return emergencyContactRepository.save(contact);
    }

    @Override
    public EmergencyContact updateEmergencyContact(EmergencyContact contact) {
        return emergencyContactRepository.save(contact);
    }

    @Transactional
    @Override
    public void deleteEmergencyContact(Integer id) {
        EmergencyContact contact = emergencyContactRepository.findById(id).orElseThrow();
        if (contact.getPatient() != null && contact.getPatient().getEmergencyContacts() != null) {
            contact.getPatient().getEmergencyContacts().removeIf(c -> c.getIdContact().equals(id));
        }
        emergencyContactRepository.delete(contact);
    }

    @Override
    public EmergencyContact getEmergencyContactById(Integer id) {
        return emergencyContactRepository.findById(id).orElseThrow();
    }
}
