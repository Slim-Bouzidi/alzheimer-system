package com.alzheimer.supportnetwork.controller;

import com.alzheimer.supportnetwork.dto.report.ReportCreateRequestDto;
import com.alzheimer.supportnetwork.dto.report.ReportResponseDto;
import com.alzheimer.supportnetwork.service.InterventionReportService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class InterventionReportController {

    private final InterventionReportService interventionReportService;

    public InterventionReportController(InterventionReportService interventionReportService) {
        this.interventionReportService = interventionReportService;
    }

    @PostMapping("/create")
    public ReportResponseDto create(@Valid @RequestBody ReportCreateRequestDto dto) {
        return interventionReportService.createReport(dto);
    }

    @GetMapping("/mission/{missionId}")
    public List<ReportResponseDto> byMission(@PathVariable Long missionId) {
        return interventionReportService.getReportsByMission(missionId);
    }
}
