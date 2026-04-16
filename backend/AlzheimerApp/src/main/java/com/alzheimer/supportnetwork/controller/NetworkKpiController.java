package com.alzheimer.supportnetwork.controller;

import com.alzheimer.supportnetwork.dto.dashboard.NetworkDashboardDto;
import com.alzheimer.supportnetwork.service.NetworkDashboardService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/network")
@CrossOrigin(origins = "*")
public class NetworkKpiController {

    private final NetworkDashboardService networkDashboardService;

    public NetworkKpiController(NetworkDashboardService networkDashboardService) {
        this.networkDashboardService = networkDashboardService;
    }

    @GetMapping("/dashboard")
    public NetworkDashboardDto dashboard() {
        return networkDashboardService.buildDashboard();
    }
}
