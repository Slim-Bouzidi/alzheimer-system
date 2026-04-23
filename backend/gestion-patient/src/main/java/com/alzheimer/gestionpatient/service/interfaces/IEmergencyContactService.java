package com.alzheimer.gestionpatient.service.interfaces;

import com.alzheimer.gestionpatient.dto.EmergencyContactDTO;
import com.alzheimer.gestionpatient.entity.EmergencyContact;

import java.util.List;

public interface IEmergencyContactService {
    List<EmergencyContact> getAllEmergencyContacts();
    EmergencyContact addEmergencyContact(EmergencyContactDTO dto);
    EmergencyContact updateEmergencyContact(EmergencyContact emergencyContact);
    void deleteEmergencyContact(Integer id);
    EmergencyContact getEmergencyContactById(Integer id);
}
