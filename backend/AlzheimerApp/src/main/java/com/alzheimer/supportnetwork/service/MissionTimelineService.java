package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.domain.DispatchStepStatus;
import com.alzheimer.supportnetwork.dto.mission.MissionTimelineEventDto;
import com.alzheimer.supportnetwork.entity.Dispatch;
import com.alzheimer.supportnetwork.entity.DispatchStepExecution;
import com.alzheimer.supportnetwork.entity.Mission;
import com.alzheimer.supportnetwork.exception.NotFoundException;
import com.alzheimer.supportnetwork.repository.DispatchRepository;
import com.alzheimer.supportnetwork.repository.DispatchStepExecutionRepository;
import com.alzheimer.supportnetwork.repository.MissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class MissionTimelineService {

    private final MissionRepository missionRepository;
    private final DispatchRepository dispatchRepository;
    private final DispatchStepExecutionRepository dispatchStepExecutionRepository;

    public MissionTimelineService(
            MissionRepository missionRepository,
            DispatchRepository dispatchRepository,
            DispatchStepExecutionRepository dispatchStepExecutionRepository) {
        this.missionRepository = missionRepository;
        this.dispatchRepository = dispatchRepository;
        this.dispatchStepExecutionRepository = dispatchStepExecutionRepository;
    }

    @Transactional(readOnly = true)
    public List<MissionTimelineEventDto> getTimeline(Long missionId) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new NotFoundException("Mission not found: " + missionId));
        List<MissionTimelineEventDto> events = new ArrayList<>();

        addEvent(events, "CREATED", mission.getCreatedAt(), null, "Mission created.");
        addEvent(
                events,
                "EMAIL_SENT",
                mission.getLastAssignedAt() != null ? mission.getLastAssignedAt() : mission.getCreatedAt(),
                null,
                "Mission assignment email sent.");

        dispatchRepository.findByMissionId(missionId).ifPresent(dispatch -> appendDispatchEvents(events, dispatch));

        addEvent(events, "ACCEPTED", mission.getAcceptedAt(), null, "Mission accepted.");
        addEvent(events, "COMPLETED", mission.getCompletedAt(), null, "Mission completed.");

        return events.stream()
                .filter(e -> e.getTimestamp() != null)
                .sorted(Comparator.comparing(MissionTimelineEventDto::getTimestamp))
                .toList();
    }

    private void appendDispatchEvents(List<MissionTimelineEventDto> events, Dispatch dispatch) {
        List<DispatchStepExecution> rows =
                dispatchStepExecutionRepository.findByDispatch_IdOrderByStepNumberAscIdAsc(dispatch.getId());
        for (DispatchStepExecution row : rows) {
            if (row.getStepNumber() > 1 && row.getStatus() == DispatchStepStatus.ASSIGNED) {
                addEvent(
                        events,
                        "ESCALATED",
                        row.getStartedAt(),
                        row.getAssigneeName(),
                        "Escalated to step " + row.getStepNumber() + ".");
            }
            if (row.getStatus() == DispatchStepStatus.SKIPPED) {
                addEvent(
                        events,
                        "DECLINED",
                        row.getStartedAt(),
                        row.getAssigneeName(),
                        "Declined or timed out at step " + row.getStepNumber() + ".");
            }
            if (row.getStatus() == DispatchStepStatus.ACCEPTED) {
                addEvent(
                        events,
                        "ACCEPTED",
                        row.getStartedAt(),
                        row.getAssigneeName(),
                        "Accepted at step " + row.getStepNumber() + ".");
            }
            if (row.getStatus() == DispatchStepStatus.COMPLETED) {
                addEvent(
                        events,
                        "COMPLETED",
                        row.getStartedAt(),
                        row.getAssigneeName(),
                        "Completed by assignee.");
            }
        }
    }

    private static void addEvent(
            List<MissionTimelineEventDto> events,
            String type,
            LocalDateTime timestamp,
            String memberName,
            String description) {
        if (timestamp == null) {
            return;
        }
        events.add(MissionTimelineEventDto.builder()
                .type(type)
                .timestamp(timestamp)
                .memberName(memberName)
                .description(description)
                .build());
    }
}
