package com.alzheimer.cognitiveservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * OpenFeign client — cognitive-service calls patient-service through Eureka.
 *
 * "patient-service" is the spring.application.name of the AlzheimerApp service.
 * Feign + Eureka resolve the actual host/port automatically — no hardcoded URL needed.
 */
@FeignClient(name = "patient-service")
public interface PatientServiceClient {

    /**
     * Calls GET /api/patient/{id} on the patient-service
     * to check whether a patient exists before saving a cognitive activity.
     */
    @GetMapping("/api/patient/{id}")
    PatientDTO getPatientById(@PathVariable("id") Integer id);
}
