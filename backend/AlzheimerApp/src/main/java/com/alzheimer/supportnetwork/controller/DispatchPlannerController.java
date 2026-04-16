package com.alzheimer.supportnetwork.controller;

import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchHistoryDetailDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchHistoryItemDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchPlanDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchPlanRequestDto;
import com.alzheimer.supportnetwork.service.AlertDispatchPlannerService;
import com.alzheimer.supportnetwork.service.DispatchHistoryService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/** HTTP API for dispatch plans; business rules live in {@link AlertDispatchPlannerService} (SSOT). */
@RestController
@RequestMapping("/api/dispatch")
@CrossOrigin(origins = "*")
public class DispatchPlannerController {

    private final AlertDispatchPlannerService dispatchPlannerService;
    private final DispatchHistoryService dispatchHistoryService;

    public DispatchPlannerController(
            AlertDispatchPlannerService dispatchPlannerService,
            DispatchHistoryService dispatchHistoryService) {
        this.dispatchPlannerService = dispatchPlannerService;
        this.dispatchHistoryService = dispatchHistoryService;
    }

    @PostMapping("/plan")
    public DispatchPlanDto generatePlan(@RequestBody DispatchPlanRequestDto request) {
        return dispatchPlannerService.generatePlan(request);
    }

    @GetMapping("/plan")
    public DispatchPlanDto generatePlanFromQuery(
            @RequestParam Long patientId,
            @RequestParam AlertType alertType) {
        DispatchPlanRequestDto request = DispatchPlanRequestDto.builder()
                .patientId(patientId)
                .alertType(alertType)
                .now(LocalDateTime.now())
                .build();
        return dispatchPlannerService.generatePlan(request);
    }

    /** Persisted dispatch runs (e.g. after alert trigger). */
    @GetMapping("/history/patient/{patientId}")
    public List<DispatchHistoryItemDto> historyForPatient(@PathVariable Long patientId) {
        return dispatchHistoryService.listForPatient(patientId);
    }

    @GetMapping("/history/{dispatchId}")
    public DispatchHistoryDetailDto historyDetail(@PathVariable Long dispatchId) {
        return dispatchHistoryService.getDetail(dispatchId);
    }
}
