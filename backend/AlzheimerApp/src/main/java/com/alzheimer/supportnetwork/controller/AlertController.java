package com.alzheimer.supportnetwork.controller;

import com.alzheimer.supportnetwork.dto.alert.AlertTriggerRequestDto;
import com.alzheimer.supportnetwork.dto.alert.AlertTriggerResponseDto;
import com.alzheimer.supportnetwork.service.AlertService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "http://localhost:4200")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @PostMapping("/trigger")
    @ResponseStatus(HttpStatus.CREATED)
    public AlertTriggerResponseDto trigger(@Valid @RequestBody AlertTriggerRequestDto body) {
        return alertService.triggerAlert(body);
    }
}
