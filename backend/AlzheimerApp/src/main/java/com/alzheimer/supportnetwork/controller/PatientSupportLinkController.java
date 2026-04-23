package com.alzheimer.supportnetwork.controller;

import com.alzheimer.supportnetwork.dto.LinkCreateDto;
import com.alzheimer.supportnetwork.entity.PatientSupportLink;
import com.alzheimer.supportnetwork.service.PatientSupportLinkService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/network")
@CrossOrigin(origins = "http://localhost:4200")
public class PatientSupportLinkController {
    private static final Logger log = LoggerFactory.getLogger(PatientSupportLinkController.class);

    private final PatientSupportLinkService service;

    public PatientSupportLinkController(PatientSupportLinkService service) {
        this.service = service;
    }

    @PostMapping("/link")
    public PatientSupportLink createLink(@RequestBody LinkCreateDto dto) {
        log.info("Incoming request: POST /api/network/link");
        return service.create(dto);
    }

    @GetMapping("/patient/{patientId}")
    public List<PatientSupportLink> getPatientNetwork(@PathVariable Long patientId) {
        log.info("Incoming request: GET /api/network/patient/{}", patientId);
        return service.getNetworkByPatient(patientId);
    }

    @PutMapping("/{linkId}")
    public PatientSupportLink updateLink(@PathVariable Long linkId, @RequestBody LinkCreateDto dto) {
        log.info("Incoming request: PUT /api/network/{}", linkId);
        return service.update(linkId, dto);
    }

    @DeleteMapping("/{linkId}")
    public void deleteLink(@PathVariable Long linkId) {
        log.info("Incoming request: DELETE /api/network/{}", linkId);
        service.delete(linkId);
    }
}
