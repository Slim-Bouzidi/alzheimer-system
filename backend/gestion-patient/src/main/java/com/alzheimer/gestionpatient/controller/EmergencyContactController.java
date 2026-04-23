package com.alzheimer.gestionpatient.controller;

import com.alzheimer.gestionpatient.dto.EmergencyContactDTO;
import com.alzheimer.gestionpatient.entity.EmergencyContact;
import com.alzheimer.gestionpatient.service.interfaces.IEmergencyContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emergencyContact")
@RequiredArgsConstructor
public class EmergencyContactController {

    private final IEmergencyContactService emergencyContactService;

    @PostMapping("/addEmergencyContact")
    public ResponseEntity<EmergencyContact> addEmergencyContact(@RequestBody EmergencyContactDTO dto) {
        return new ResponseEntity<>(emergencyContactService.addEmergencyContact(dto), HttpStatus.CREATED);
    }

    @GetMapping("/allEmergencyContact")
    public ResponseEntity<List<EmergencyContact>> getAllEmergencyContacts() {
        return ResponseEntity.ok(emergencyContactService.getAllEmergencyContacts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmergencyContact> getEmergencyContactById(@PathVariable Integer id) {
        return ResponseEntity.ok(emergencyContactService.getEmergencyContactById(id));
    }

    @PutMapping("/update")
    public ResponseEntity<EmergencyContact> updateEmergencyContact(@RequestBody EmergencyContact emergencyContact) {
        return ResponseEntity.ok(emergencyContactService.updateEmergencyContact(emergencyContact));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteEmergencyContact(@PathVariable Integer id) {
        emergencyContactService.deleteEmergencyContact(id);
        return ResponseEntity.noContent().build();
    }
}
