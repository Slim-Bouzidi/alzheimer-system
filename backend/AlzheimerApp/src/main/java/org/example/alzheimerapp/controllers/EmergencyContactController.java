package org.example.alzheimerapp.controllers;

import org.example.alzheimerapp.dtos.EmergencyContactDTO;
import org.example.alzheimerapp.entities.EmergencyContact;
import org.example.alzheimerapp.entities.Patient;
import org.example.alzheimerapp.repositories.PatientRepository;
import org.example.alzheimerapp.services.interfaces.IEmergencyContactService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emergencyContact")
public class EmergencyContactController {

    private final IEmergencyContactService emergencyContactService;
    private final PatientRepository patientRepository;

    public EmergencyContactController(IEmergencyContactService emergencyContactService,
            PatientRepository patientRepository) {
        this.emergencyContactService = emergencyContactService;
        this.patientRepository = patientRepository;
    }

    @PostMapping("/addEmergencyContact")
    public EmergencyContact addEmergencyContact(@RequestBody EmergencyContactDTO dto) {
        System.out.println("=== RECEPTION CONTACT D'URGENCE ===");
        System.out.println("FullName: " + dto.getFullName());
        System.out.println("Relationship: " + dto.getRelationship());
        System.out.println("Phone: " + dto.getPhone());
        System.out.println("Email: " + dto.getEmail());
        System.out.println("Patient ID: " + dto.getPatientId());
        System.out.println("====================================");

        // Charger le patient depuis la base de données
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient non trouvé avec l'ID: " + dto.getPatientId()));

        // Créer l'entité EmergencyContact avec les données du DTO
        EmergencyContact contact = new EmergencyContact();
        contact.setFullName(dto.getFullName());
        contact.setRelationship(dto.getRelationship());
        contact.setPhone(dto.getPhone());
        contact.setEmail(dto.getEmail());
        contact.setPatient(patient);

        System.out.println("=== CONTACT CRÉÉ ===");
        System.out.println("FullName: " + contact.getFullName());
        System.out.println("Relationship: " + contact.getRelationship());
        System.out.println("Phone: " + contact.getPhone());
        System.out.println("Email: " + contact.getEmail());
        System.out.println("Patient ID: " + contact.getPatient().getIdPatient());
        System.out.println("====================");

        return emergencyContactService.addEmergencyContact(contact);
    }

    @GetMapping("/allEmergencyContact")
    public List<EmergencyContact> getAllEmergencyContacts() {
        return emergencyContactService.getAllEmergencyContacts();
    }

    @GetMapping("/{id}")
    public EmergencyContact getEmergencyContact(@PathVariable("id") Integer id) {
        return emergencyContactService.getEmergencyContactById(id);
    }

    @PutMapping("/update")
    public EmergencyContact updateEmergencyContact(@RequestBody EmergencyContact contact) {
        return emergencyContactService.updateEmergencyContact(contact);
    }

    @DeleteMapping("/delete/{id}")
    public void deleteEmergencyContact(@PathVariable("id") Integer id) {
        emergencyContactService.deleteEmergencyContact(id);
    }
}
