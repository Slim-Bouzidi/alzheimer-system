package com.alzheimer.supportnetwork.controller;

import com.alzheimer.supportnetwork.dto.engine.BestIntervenantsRequestDto;
import com.alzheimer.supportnetwork.dto.engine.BestIntervenantsResponseDto;
import com.alzheimer.supportnetwork.service.SupportNetworkEngineService;
import org.springframework.web.bind.annotation.*;

/** HTTP API for Best Intervenants; business rules live in {@link SupportNetworkEngineService} (SSOT). */
@RestController
@RequestMapping("/api/engine")
@CrossOrigin(origins = "http://localhost:4200")
public class SupportNetworkEngineController {

    private final SupportNetworkEngineService supportNetworkEngineService;

    public SupportNetworkEngineController(SupportNetworkEngineService supportNetworkEngineService) {
        this.supportNetworkEngineService = supportNetworkEngineService;
    }

    @PostMapping("/best-intervenants")
    public BestIntervenantsResponseDto bestIntervenants(@RequestBody BestIntervenantsRequestDto request) {
        return supportNetworkEngineService.rankBestIntervenants(request);
    }
}
