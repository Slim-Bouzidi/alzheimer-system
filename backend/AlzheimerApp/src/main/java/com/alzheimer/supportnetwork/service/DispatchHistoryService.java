package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.domain.DispatchStatus;
import com.alzheimer.supportnetwork.domain.DispatchStepStatus;
import com.alzheimer.supportnetwork.domain.MissionStatus;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchAssigneeDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchHistoryDetailDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchHistoryItemDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchPlanDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchStepDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchStepExecutionDto;
import com.alzheimer.supportnetwork.entity.Dispatch;
import com.alzheimer.supportnetwork.entity.DispatchStepExecution;
import com.alzheimer.supportnetwork.exception.NotFoundException;
import com.alzheimer.supportnetwork.repository.DispatchRepository;
import com.alzheimer.supportnetwork.repository.DispatchStepExecutionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DispatchHistoryService {

    private static final Logger log = LoggerFactory.getLogger(DispatchHistoryService.class);
    private static final String DECLINED_VIA_EMAIL_NOTE = "Assignee declined via email link";

    private final DispatchRepository dispatchRepository;
    private final DispatchStepExecutionRepository dispatchStepExecutionRepository;

    public DispatchHistoryService(
            DispatchRepository dispatchRepository,
            DispatchStepExecutionRepository dispatchStepExecutionRepository) {
        this.dispatchRepository = dispatchRepository;
        this.dispatchStepExecutionRepository = dispatchStepExecutionRepository;
    }

    /**
     * Persists the generated plan: one {@link DispatchStepExecution} row per assignee in each step.
     * Step-1 primary assignee rows matching {@code primaryAssigneeMemberId} are marked {@link DispatchStepStatus#ASSIGNED}.
     */
    @Transactional
    public Dispatch persistDispatchSnapshot(
            DispatchPlanDto plan,
            Long patientId,
            AlertType alertType,
            LocalDateTime now,
            Long primaryAssigneeMemberId) {

        Dispatch dispatch = Dispatch.builder()
                .patientId(patientId)
                .alertType(alertType)
                .generatedAt(now)
                .status(DispatchStatus.CREATED)
                .missionId(null)
                .build();
        dispatch = dispatchRepository.save(dispatch);

        if (plan != null && plan.getSteps() != null) {
            for (DispatchStepDto step : plan.getSteps()) {
                int stepNumber = step.getStepNumber();
                int timeoutMinutes = step.getTimeoutMinutes();
                List<DispatchAssigneeDto> assignees =
                        step.getAssignees() != null ? step.getAssignees() : List.of();
                for (DispatchAssigneeDto a : assignees) {
                    if (a.getMemberId() == null) {
                        continue;
                    }
                    DispatchStepStatus rowStatus =
                            stepNumber == 1 && Objects.equals(primaryAssigneeMemberId, a.getMemberId())
                                    ? DispatchStepStatus.ASSIGNED
                                    : DispatchStepStatus.PENDING;
                    DispatchStepExecution row = DispatchStepExecution.builder()
                            .dispatch(dispatch)
                            .stepNumber(stepNumber)
                            .timeoutMinutes(timeoutMinutes)
                            .assigneeMemberId(a.getMemberId())
                            .assigneeName(a.getFullName())
                            .status(rowStatus)
                            .startedAt(now)
                            .build();
                    dispatchStepExecutionRepository.save(row);
                }
            }
        }

        return dispatchRepository.findById(dispatch.getId()).orElse(dispatch);
    }

    @Transactional
    public void attachMission(Long dispatchId, Long missionId) {
        Dispatch d = dispatchRepository.findById(dispatchId)
                .orElseThrow(() -> new NotFoundException("Dispatch not found: " + dispatchId));
        d.setMissionId(missionId);
        d.setStatus(DispatchStatus.IN_PROGRESS);
        dispatchRepository.save(d);
    }

    /**
     * When the linked mission is accepted, closes the dispatch in persistence: header {@link
     * DispatchStatus#COMPLETED} and all {@link DispatchStepStatus#ASSIGNED} rows become {@link
     * DispatchStepStatus#ACCEPTED}.
     */
    @Transactional
    public void onMissionAccepted(Long missionId) {
        if (missionId == null) {
            return;
        }
        Optional<Dispatch> opt = dispatchRepository.findByMissionId(missionId);
        if (opt.isEmpty()) {
            return;
        }
        Dispatch d = opt.get();
        if (d.getStatus() != DispatchStatus.IN_PROGRESS) {
            return;
        }
        d.setStatus(DispatchStatus.COMPLETED);
        dispatchRepository.save(d);
        List<DispatchStepExecution> rows =
                dispatchStepExecutionRepository.findByDispatch_IdOrderByStepNumberAscIdAsc(d.getId());
        for (DispatchStepExecution e : rows) {
            if (e.getStatus() == DispatchStepStatus.ASSIGNED) {
                e.setStatus(DispatchStepStatus.ACCEPTED);
                dispatchStepExecutionRepository.save(e);
            }
        }
    }

    /** How an escalation trigger was initiated. */
    public enum EscalationTrigger {
        SCHEDULER_TIMEOUT,
        EMAIL_DECLINE
    }

    /**
     * Common escalation transition for both scheduler timeouts and email decline.
     * Marks current ASSIGNED rows as SKIPPED, then either ASSIGNS next-step rows or
     * closes the dispatch as ESCALATED when no next step exists.
     */
    @Transactional
    public ForceEscalationResult forceEscalation(
            Long missionId, int currentStepNumber, LocalDateTime now, EscalationTrigger trigger) {
        return forceEscalationInternal(missionId, currentStepNumber, now, trigger, null);
    }

    /**
     * Same as {@link #forceEscalation(Long, int, LocalDateTime, EscalationTrigger)} but optionally narrows current
     * ASSIGNED rows to one assignee (used by manual decline).
     */
    @Transactional
    public ForceEscalationResult forceEscalationForMember(
            Long missionId,
            int currentStepNumber,
            Long assigneeMemberId,
            LocalDateTime now,
            EscalationTrigger trigger) {
        return forceEscalationInternal(missionId, currentStepNumber, now, trigger, assigneeMemberId);
    }

    private ForceEscalationResult forceEscalationInternal(
            Long missionId,
            int currentStepNumber,
            LocalDateTime now,
            EscalationTrigger trigger,
            Long assigneeFilterOrNull) {
        if (missionId == null) {
            return ForceEscalationResult.noDispatch();
        }
        Optional<Dispatch> opt = dispatchRepository.findByMissionId(missionId);
        if (opt.isEmpty()) {
            return ForceEscalationResult.noDispatch();
        }
        Dispatch d = opt.get();
        if (d.getStatus() != DispatchStatus.IN_PROGRESS) {
            return ForceEscalationResult.alreadyHandledResult();
        }

        List<DispatchStepExecution> steps =
                dispatchStepExecutionRepository.findByDispatch_IdOrderByStepNumberAscIdAsc(d.getId());
        if (steps.isEmpty()) {
            return ForceEscalationResult.noDispatch();
        }

        List<DispatchStepExecution> currentAssigned = steps.stream()
                .filter(e -> e.getStepNumber() == currentStepNumber && e.getStatus() == DispatchStepStatus.ASSIGNED)
                .filter(e -> assigneeFilterOrNull == null || Objects.equals(assigneeFilterOrNull, e.getAssigneeMemberId()))
                .collect(Collectors.toList());
        if (currentAssigned.isEmpty()) {
            return ForceEscalationResult.alreadyHandledResult();
        }

        for (DispatchStepExecution row : currentAssigned) {
            row.setStatus(DispatchStepStatus.SKIPPED);
            dispatchStepExecutionRepository.save(row);
        }

        int nextStep = currentStepNumber + 1;
        log.info("[FORCED ESCALATION] moving to step {}", nextStep);
        List<DispatchStepExecution> nextPending =
                steps.stream()
                        .filter(e -> e.getStepNumber() == nextStep && e.getStatus() == DispatchStepStatus.PENDING)
                        .collect(Collectors.toList());

        if (nextPending.isEmpty()) {
            closeDispatchAsExhausted(d);
            return ForceEscalationResult.finalEscalated();
        }

        for (DispatchStepExecution row : nextPending) {
            row.setStatus(DispatchStepStatus.ASSIGNED);
            row.setStartedAt(now);
            dispatchStepExecutionRepository.save(row);
        }
        long nextMember = nextPending.get(0).getAssigneeMemberId();
        log.info("[ESCALATION RESULT] newAssignedMemberId={}", nextMember);
        return ForceEscalationResult.nextStep(nextMember, nextStep, trigger);
    }

    /**
     * When the assignee declines from email while the mission is still {@link MissionStatus#PENDING}: marks their
     * current-step {@link DispatchStepStatus#ASSIGNED} row(s) as {@link DispatchStepStatus#SKIPPED}, then either
     * escalates to the next step (same mission, new assignee) or closes the dispatch like a final escalation.
     */
    @Transactional
    public AssigneeDeclineResult handleAssigneeDeclined(
            Long missionId, Long declinedMemberId, int missionStepNumber, LocalDateTime now) {
        ForceEscalationResult result = forceEscalationForMember(
                missionId,
                missionStepNumber,
                declinedMemberId,
                now,
                EscalationTrigger.EMAIL_DECLINE);
        if (result.nextStepAssigned()) {
            return AssigneeDeclineResult.escalated(result.nextAssigneeMemberId(), result.nextStepNumber());
        }
        if (result.noDispatchFound()) {
            return AssigneeDeclineResult.cancelMissionOnly();
        }
        return AssigneeDeclineResult.cancelMissionOnly();
    }

    private void closeDispatchAsExhausted(Dispatch d) {
        d.setStatus(DispatchStatus.ESCALATED);
        dispatchRepository.save(d);
        for (DispatchStepExecution e :
                dispatchStepExecutionRepository.findByDispatch_IdOrderByStepNumberAscIdAsc(d.getId())) {
            if (e.getStatus() == DispatchStepStatus.PENDING) {
                e.setStatus(DispatchStepStatus.SKIPPED);
                dispatchStepExecutionRepository.save(e);
            }
        }
    }

    public static String declineNote() {
        return DECLINED_VIA_EMAIL_NOTE;
    }

    /** Result of an escalation transition shared by scheduler and email decline. */
    public record ForceEscalationResult(
            boolean noDispatchFound,
            boolean alreadyHandled,
            boolean nextStepAssigned,
            boolean finalEscalationReached,
            Long nextAssigneeMemberId,
            int nextStepNumber,
            EscalationTrigger trigger) {
        public static ForceEscalationResult noDispatch() {
            return new ForceEscalationResult(true, false, false, false, null, 0, null);
        }

        public static ForceEscalationResult alreadyHandledResult() {
            return new ForceEscalationResult(false, true, false, false, null, 0, null);
        }

        public static ForceEscalationResult nextStep(Long nextMember, int nextStep, EscalationTrigger trigger) {
            return new ForceEscalationResult(false, false, true, false, nextMember, nextStep, trigger);
        }

        public static ForceEscalationResult finalEscalated() {
            return new ForceEscalationResult(false, false, false, true, null, 0, null);
        }
    }

    /** Outcome of {@link #handleAssigneeDeclined(Long, Long, int, LocalDateTime)} for mission decline orchestration. */
    public record AssigneeDeclineResult(boolean escalatedToNextResponder, Long nextAssigneeMemberId, int nextStepNumber) {

        public static AssigneeDeclineResult cancelMissionOnly() {
            return new AssigneeDeclineResult(false, null, 0);
        }

        public static AssigneeDeclineResult escalated(long nextAssigneeMemberId, int nextStepNumber) {
            return new AssigneeDeclineResult(true, nextAssigneeMemberId, nextStepNumber);
        }
    }

    /** Marks {@link DispatchStepStatus#ACCEPTED} rows as {@link DispatchStepStatus#COMPLETED} when the mission ends. */
    @Transactional
    public void onMissionCompleted(Long missionId) {
        if (missionId == null) {
            return;
        }
        Optional<Dispatch> opt = dispatchRepository.findByMissionId(missionId);
        if (opt.isEmpty()) {
            return;
        }
        Dispatch d = opt.get();
        List<DispatchStepExecution> rows =
                dispatchStepExecutionRepository.findByDispatch_IdOrderByStepNumberAscIdAsc(d.getId());
        for (DispatchStepExecution e : rows) {
            if (e.getStatus() == DispatchStepStatus.ACCEPTED) {
                e.setStatus(DispatchStepStatus.COMPLETED);
                dispatchStepExecutionRepository.save(e);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<DispatchHistoryItemDto> listForPatient(Long patientId) {
        return dispatchRepository.findByPatientIdOrderByGeneratedAtDesc(patientId).stream()
                .map(this::toItemDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public Long findDispatchIdByMissionId(Long missionId) {
        if (missionId == null) {
            return null;
        }
        return dispatchRepository.findByMissionId(missionId)
                .map(Dispatch::getId)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public DispatchHistoryDetailDto getDetail(Long dispatchId) {
        Dispatch d = dispatchRepository.findById(dispatchId)
                .orElseThrow(() -> new NotFoundException("Dispatch not found: " + dispatchId));
        List<DispatchStepExecutionDto> steps = dispatchStepExecutionRepository
                .findByDispatch_IdOrderByStepNumberAscIdAsc(dispatchId)
                .stream()
                .map(this::toStepDto)
                .toList();
        DispatchHistoryDetailDto dto = toDetailHeader(d);
        dto.setSteps(steps);
        return dto;
    }

    private DispatchHistoryItemDto toItemDto(Dispatch d) {
        return DispatchHistoryItemDto.builder()
                .id(d.getId())
                .patientId(d.getPatientId())
                .alertType(d.getAlertType())
                .generatedAt(d.getGeneratedAt())
                .status(d.getStatus())
                .missionId(d.getMissionId())
                .build();
    }

    private DispatchHistoryDetailDto toDetailHeader(Dispatch d) {
        return DispatchHistoryDetailDto.builder()
                .id(d.getId())
                .patientId(d.getPatientId())
                .alertType(d.getAlertType())
                .generatedAt(d.getGeneratedAt())
                .status(d.getStatus())
                .missionId(d.getMissionId())
                .build();
    }

    private DispatchStepExecutionDto toStepDto(DispatchStepExecution e) {
        return DispatchStepExecutionDto.builder()
                .id(e.getId())
                .stepNumber(e.getStepNumber())
                .timeoutMinutes(e.getTimeoutMinutes())
                .assigneeMemberId(e.getAssigneeMemberId())
                .assigneeName(e.getAssigneeName())
                .status(e.getStatus())
                .startedAt(e.getStartedAt())
                .build();
    }
}
