package com.alzheimer.supportnetwork.controller;

import com.alzheimer.supportnetwork.dto.PatientCreateDto;
import com.alzheimer.supportnetwork.entity.Patient;
import com.alzheimer.supportnetwork.service.PatientService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController("supportNetworkPatientController")
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    private final PatientService service;

    public PatientController(PatientService service) {
        this.service = service;
    }

    @PostMapping
    public Patient create(@RequestBody PatientCreateDto dto) {
        return service.create(dto);
    }

    @GetMapping
    public List<Patient> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Patient getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    public Patient update(@PathVariable Long id, @RequestBody PatientCreateDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
