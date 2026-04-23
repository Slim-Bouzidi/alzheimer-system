package com.alzheimer.supportnetwork.controller;

import com.alzheimer.supportnetwork.dto.mission.MissionDispatchRequestDto;
import com.alzheimer.supportnetwork.dto.mission.MissionResponseDto;
import com.alzheimer.supportnetwork.dto.mission.MissionTimelineEventDto;
import com.alzheimer.supportnetwork.service.MissionService;
import com.alzheimer.supportnetwork.service.MissionTimelineService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/missions")
@CrossOrigin(origins = "http://localhost:4200")
public class MissionController {
    private static final Logger log = LoggerFactory.getLogger(MissionController.class);

    private final MissionService missionService;
    private final MissionTimelineService missionTimelineService;

    public MissionController(MissionService missionService, MissionTimelineService missionTimelineService) {
        this.missionService = missionService;
        this.missionTimelineService = missionTimelineService;
    }

    @PostMapping("/dispatch")
    public MissionResponseDto dispatch(@Valid @RequestBody MissionDispatchRequestDto dto) {
        log.info("Incoming request: POST /api/missions/dispatch");
        return missionService.dispatchMission(dto);
    }

    @GetMapping("/my/{memberId}")
    public List<MissionResponseDto> myMissions(@PathVariable Long memberId) {
        log.info("Incoming request: GET /api/missions/my/{}", memberId);
        return missionService.getMissionsForMember(memberId);
    }

    @PatchMapping("/{missionId}/accept")
    public MissionResponseDto accept(@PathVariable Long missionId) {
        log.info("Incoming request: PATCH /api/missions/{}/accept", missionId);
        return missionService.acceptMission(missionId);
    }

    @PatchMapping("/{missionId}/complete")
    public MissionResponseDto complete(@PathVariable Long missionId) {
        log.info("Incoming request: PATCH /api/missions/{}/complete", missionId);
        return missionService.completeMission(missionId);
    }

    @GetMapping("/{missionId}/timeline")
    public List<MissionTimelineEventDto> timeline(@PathVariable Long missionId) {
        log.info("Incoming request: GET /api/missions/{}/timeline", missionId);
        return missionTimelineService.getTimeline(missionId);
    }
}
