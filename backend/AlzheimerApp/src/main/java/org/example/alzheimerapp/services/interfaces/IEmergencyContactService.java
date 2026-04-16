package org.example.alzheimerapp.services.interfaces;

import org.example.alzheimerapp.entities.EmergencyContact;

import java.util.List;

public interface IEmergencyContactService {

    List<EmergencyContact> getAllEmergencyContacts();

    EmergencyContact addEmergencyContact(EmergencyContact contact);

    EmergencyContact updateEmergencyContact(EmergencyContact contact);

    void deleteEmergencyContact(Integer id);

    EmergencyContact getEmergencyContactById(Integer id);
}

