package com.alzheimer.supportnetwork.controller;

import com.alzheimer.supportnetwork.dto.dashboard.NetworkDashboardDto;
import com.alzheimer.supportnetwork.service.NetworkDashboardService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:4200")
public class NetworkDashboardController {

    private final NetworkDashboardService networkDashboardService;

    public NetworkDashboardController(NetworkDashboardService networkDashboardService) {
        this.networkDashboardService = networkDashboardService;
    }

    @GetMapping("/network")
    public NetworkDashboardDto getNetworkDashboard() {
        return networkDashboardService.buildDashboard();
    }
}
