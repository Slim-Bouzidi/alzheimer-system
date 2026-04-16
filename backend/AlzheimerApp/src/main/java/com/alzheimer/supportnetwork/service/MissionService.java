package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.domain.MissionStatus;
import com.alzheimer.supportnetwork.dto.mail.EmailSendOutcome;
import com.alzheimer.supportnetwork.dto.mission.MissionDispatchRequestDto;
import com.alzheimer.supportnetwork.dto.mission.MissionResponseDto;
import com.alzheimer.supportnetwork.entity.Mission;
import com.alzheimer.supportnetwork.entity.MissionActionToken;
import com.alzheimer.supportnetwork.exception.ConflictException;
import com.alzheimer.supportnetwork.exception.NotFoundException;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchPlanDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchPlanRequestDto;
import com.alzheimer.supportnetwork.entity.Dispatch;
import com.alzheimer.supportnetwork.entity.SupportMember;
import com.alzheimer.supportnetwork.repository.MissionRepository;
import com.alzheimer.supportnetwork.repository.PatientRepository;
import com.alzheimer.supportnetwork.repository.SupportMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class MissionService {

    private static final Logger log = LoggerFactory.getLogger(MissionService.class);
    private static final String FINAL_ESCALATION_AFTER_DECLINE_NOTE =
            "Final escalation reached after manual decline";

    private final MissionRepository missionRepository;
    private final PatientRepository patientRepository;
    private final SupportMemberRepository supportMemberRepository;
    private final AlertDispatchPlannerService alertDispatchPlannerService;
    private final DispatchHistoryService dispatchHistoryService;
    private final EmailNotificationService emailNotificationService;
    private final MissionActionTokenService missionActionTokenService;
    private final RealtimeEventService realtimeEventService;
    private final NotificationService notificationService;
    private final String adminNotificationEmail;

    public MissionService(
            MissionRepository missionRepository,
            PatientRepository patientRepository,
            SupportMemberRepository supportMemberRepository,
            AlertDispatchPlannerService alertDispatchPlannerService,
            DispatchHistoryService dispatchHistoryService,
            EmailNotificationService emailNotificationService,
            MissionActionTokenService missionActionTokenService,
            RealtimeEventService realtimeEventService,
            NotificationService notificationService,
            @Value("${support.network.mail.admin-email:}") String adminNotificationEmail) {
        this.missionRepository = missionRepository;
        this.patientRepository = patientRepository;
        this.supportMemberRepository = supportMemberRepository;
        this.alertDispatchPlannerService = alertDispatchPlannerService;
        this.dispatchHistoryService = dispatchHistoryService;
        this.emailNotificationService = emailNotificationService;
        this.missionActionTokenService = missionActionTokenService;
        this.realtimeEventService = realtimeEventService;
        this.notificationService = notificationService;
        this.adminNotificationEmail = adminNotificationEmail;
    }

    @Transactional
    public MissionResponseDto dispatchMission(MissionDispatchRequestDto dto) {
        return dispatchMission(dto, LocalDateTime.now());
    }

    /**
     * Same as {@link #dispatchMission(MissionDispatchRequestDto)} but uses the given {@code now}
     * for mission timestamps and dispatch-plan generation (e.g. alert trigger orchestration).
     */
    @Transactional
    public MissionResponseDto dispatchMission(MissionDispatchRequestDto dto, LocalDateTime now) {
        patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new NotFoundException("Patient not found: " + dto.getPatientId()));
        supportMemberRepository.findById(dto.getAssignedMemberId())
                .orElseThrow(() -> new NotFoundException("Support member not found: " + dto.getAssignedMemberId()));

        AlertType alertType = parseAlertType(dto.getAlertType());

        Mission mission = Mission.builder()
                .patientId(dto.getPatientId())
                .assignedMemberId(dto.getAssignedMemberId())
                .alertType(alertType)
                .title(dto.getTitle().trim())
                .description(dto.getDescription() != null ? dto.getDescription().trim() : null)
                .status(MissionStatus.PENDING)
                .stepNumber(1)
                .lastAssignedAt(now)
                .createdAt(now)
                .build();

        Mission saved = missionRepository.save(mission);
        log.info("[MISSION DISPATCH] missionId={} assignedMemberId={}", saved.getId(), saved.getAssignedMemberId());
        realtimeEventService.sendMissionUpdate(saved.getAssignedMemberId(), saved);
        notifyMember(saved.getAssignedMemberId(), "New mission assigned (#" + saved.getId() + ").", "MISSION_ASSIGNED");

        DispatchPlanDto plan = alertDispatchPlannerService.generatePlan(
                DispatchPlanRequestDto.builder()
                        .patientId(dto.getPatientId())
                        .alertType(alertType)
                        .now(now)
                        .build());
        alertDispatchPlannerService.storePlanForMission(saved.getId(), plan);

        // Persist dispatch header + step rows for UI history (same path as alert trigger — single source of truth).
        Dispatch persistedDispatch =
                dispatchHistoryService.persistDispatchSnapshot(
                        plan, dto.getPatientId(), alertType, now, dto.getAssignedMemberId());
        dispatchHistoryService.attachMission(persistedDispatch.getId(), saved.getId());
        realtimeEventService.sendDispatchUpdate(
                persistedDispatch.getId(), "Mission dispatched (missionId=" + saved.getId() + ")");

        log.info("Step 1 started for mission {}", saved.getId());

        SupportMember assignee = supportMemberRepository.findById(saved.getAssignedMemberId()).orElse(null);
        if (assignee != null && StringUtils.hasText(assignee.getEmail())) {
            log.info(
                    "[BREVO TRACE] missionId={} assignedMemberId={} supportMember.email={} (this value is passed to Brevo as intendedRecipient)",
                    saved.getId(),
                    assignee.getId(),
                    assignee.getEmail().trim());
            try {
                MissionActionToken acceptToken =
                        missionActionTokenService.createAcceptToken(saved.getId(), saved.getAssignedMemberId());
                MissionActionToken declineToken =
                        missionActionTokenService.createDeclineToken(saved.getId(), saved.getAssignedMemberId());
                log.info(
                        "Mission {} assigned; email action tokens issued (accept+decline) for memberId={}",
                        saved.getId(),
                        saved.getAssignedMemberId());
                EmailSendOutcome emailOutcome =
                        emailNotificationService.sendMissionAssignedEmail(
                                assignee.getEmail().trim(), saved, acceptToken.getToken(), declineToken.getToken());
                logMissionEmailOutcome("MISSION_ASSIGNED", saved.getId(), emailOutcome);
            } catch (Exception ex) {
                log.error(
                        "Mission {} created but email/token step failed: {}",
                        saved.getId(),
                        ex.toString(),
                        ex);
            }
        } else {
            log.info("No email available for member {}", saved.getAssignedMemberId());
        }

        return toDto(saved);
    }

    /**
     * Declines a {@link MissionStatus#PENDING} mission: cancels it, or escalates to the next dispatch step when a
     * linked {@link com.alzheimer.supportnetwork.entity.Dispatch} exists (same behaviour as timeout escalation).
     */
    @Transactional
    public MissionResponseDto declineMission(Long missionId) {
        Mission mission =
                missionRepository.findById(missionId).orElseThrow(() -> new NotFoundException("Mission not found: " + missionId));
        Long declinedMemberId = mission.getAssignedMemberId();
        assertPendingForAccept(mission.getStatus());
        LocalDateTime now = LocalDateTime.now();
        DispatchHistoryService.AssigneeDeclineResult outcome =
                dispatchHistoryService.handleAssigneeDeclined(
                        missionId, mission.getAssignedMemberId(), mission.getStepNumber(), now);
        if (outcome.escalatedToNextResponder()) {
            log.info("[EMAIL DECLINE] missionId={} memberId={}", missionId, mission.getAssignedMemberId());
            mission.setStepNumber(outcome.nextStepNumber());
            mission.setAssignedMemberId(outcome.nextAssigneeMemberId());
            mission.setLastAssignedAt(now);
            Mission saved = missionRepository.save(mission);
            notifyAssigneeWithEmailActionTokens(saved);
            realtimeEventService.sendMissionUpdate(saved.getAssignedMemberId(), saved);
            notifyMember(saved.getAssignedMemberId(), "Mission escalated to you (#" + saved.getId() + ").", "MISSION_ESCALATED");
            Long dispatchId = dispatchHistoryService.findDispatchIdByMissionId(saved.getId());
            if (dispatchId != null) {
                realtimeEventService.sendDispatchUpdate(
                        dispatchId,
                        "Escalation triggered: step " + saved.getStepNumber());
            }
            if (declinedMemberId != null) {
                notifyMember(
                        declinedMemberId,
                        "Mission #" + missionId + " declined and escalated to next responder.",
                        "MISSION_DECLINED");
            }
            log.info(
                    "[FORCED ESCALATION] missionId={} movingToStep={} newAssigneeMemberId={}",
                    missionId,
                    outcome.nextStepNumber(),
                    outcome.nextAssigneeMemberId());
            return toDto(saved);
        }
        mission.setStatus(MissionStatus.CANCELLED);
        mission.setDescription(appendFinalEscalationAfterDeclineNote(mission.getDescription()));
        Mission saved = missionRepository.save(mission);
        realtimeEventService.sendMissionUpdate(declinedMemberId, saved);
        notifyMember(
                declinedMemberId,
                "Mission #" + missionId + " declined with no next responder.",
                "MISSION_DECLINED");
        log.info("[EMAIL DECLINE] missionId={} memberId={}", missionId, mission.getAssignedMemberId());
        log.warn("[FINAL ESCALATION] no more steps missionId={}", missionId);
        try {
            EmailSendOutcome emailOutcome =
                    emailNotificationService.sendEscalationEmail(
                            adminNotificationEmail,
                            FINAL_ESCALATION_AFTER_DECLINE_NOTE + " (missionId=" + missionId + ")");
            logMissionEmailOutcome("FINAL_ESCALATION_AFTER_DECLINE", missionId, emailOutcome);
        } catch (Exception ex) {
            log.error(
                    "Final escalation email after decline threw for mission {}: {}",
                    missionId,
                    ex.toString(),
                    ex);
        }
        alertDispatchPlannerService.removeStoredPlanForMission(missionId);
        log.info("[Mission] Declined; mission cancelled missionId={}", missionId);
        return toDto(saved);
    }

    private void notifyAssigneeWithEmailActionTokens(Mission mission) {
        SupportMember assignee = supportMemberRepository.findById(mission.getAssignedMemberId()).orElse(null);
        if (assignee == null || !StringUtils.hasText(assignee.getEmail())) {
            log.info("No email for assignee member {} (mission {})", mission.getAssignedMemberId(), mission.getId());
            return;
        }
        try {
            MissionActionToken acceptToken =
                    missionActionTokenService.createAcceptToken(mission.getId(), mission.getAssignedMemberId());
            MissionActionToken declineToken =
                    missionActionTokenService.createDeclineToken(mission.getId(), mission.getAssignedMemberId());
            log.info(
                    "[BREVO TRACE] missionId={} assignedMemberId={} supportMember.email={} (reassignment after decline)",
                    mission.getId(),
                    assignee.getId(),
                    assignee.getEmail().trim());
            log.info(
                    "[EMAIL TRIGGER] sending mission email to memberId={} email={}",
                    assignee.getId(),
                    assignee.getEmail().trim());
            EmailSendOutcome emailOutcome =
                    emailNotificationService.sendMissionAssignedEmail(
                            assignee.getEmail().trim(), mission, acceptToken.getToken(), declineToken.getToken());
            logMissionEmailOutcome("MISSION_ASSIGNED_REASSIGN", mission.getId(), emailOutcome);
        } catch (Exception ex) {
            log.error(
                    "Mission {} reassignment email/token step failed: {}",
                    mission.getId(),
                    ex.toString(),
                    ex);
        }
    }

    private static String appendFinalEscalationAfterDeclineNote(String existing) {
        String note = FINAL_ESCALATION_AFTER_DECLINE_NOTE;
        if (note == null || note.isBlank()) {
            return existing;
        }
        if (existing == null || existing.isBlank()) {
            return note;
        }
        if (existing.contains(note)) {
            return existing;
        }
        return existing.trim() + System.lineSeparator() + note;
    }

    @Transactional(readOnly = true)
    public List<MissionResponseDto> getMissionsForMember(Long memberId) {
        return missionRepository.findByAssignedMemberId(memberId).stream()
                .sorted(Comparator
                        .comparing(MissionService::missionStatusSortKey)
                        .thenComparing(Mission::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(this::toDto)
                .toList();
    }

    /** PENDING first (actionable), then ACCEPTED, COMPLETED, CANCELLED; newest first within the same status. */
    private static int missionStatusSortKey(Mission m) {
        MissionStatus s = m.getStatus();
        if (s == null) {
            return 9;
        }
        return switch (s) {
            case PENDING -> 0;
            case ACCEPTED -> 1;
            case COMPLETED -> 2;
            case CANCELLED -> 3;
        };
    }

    @Transactional
    public MissionResponseDto acceptMission(Long missionId) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new NotFoundException("Mission not found: " + missionId));
        assertPendingForAccept(mission.getStatus());
        mission.setStatus(MissionStatus.ACCEPTED);
        mission.setAcceptedAt(LocalDateTime.now());
        Mission saved = missionRepository.save(mission);
        log.info("[MISSION ACCEPT] missionId={} memberId={}", missionId, mission.getAssignedMemberId());
        realtimeEventService.sendMissionUpdate(saved.getAssignedMemberId(), saved);
        notifyMember(saved.getAssignedMemberId(), "Mission #" + missionId + " accepted.", "MISSION_ACCEPTED");
        dispatchHistoryService.onMissionAccepted(missionId);
        Long acceptedDispatchId = dispatchHistoryService.findDispatchIdByMissionId(missionId);
        if (acceptedDispatchId != null) {
            realtimeEventService.sendDispatchUpdate(acceptedDispatchId, "Mission accepted");
        }
        alertDispatchPlannerService.removeStoredPlanForMission(missionId);
        log.info("[Escalation] Stopped for mission {} (accepted)", missionId);
        return toDto(saved);
    }

    @Transactional
    public MissionResponseDto completeMission(Long missionId) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new NotFoundException("Mission not found: " + missionId));
        assertAcceptedForComplete(mission.getStatus());
        mission.setStatus(MissionStatus.COMPLETED);
        mission.setCompletedAt(LocalDateTime.now());
        Mission saved = missionRepository.save(mission);
        log.info("[MISSION COMPLETE] missionId={}", missionId);
        realtimeEventService.sendMissionUpdate(saved.getAssignedMemberId(), saved);
        notifyMember(saved.getAssignedMemberId(), "Mission #" + missionId + " completed.", "MISSION_COMPLETED");
        dispatchHistoryService.onMissionCompleted(missionId);
        Long completedDispatchId = dispatchHistoryService.findDispatchIdByMissionId(missionId);
        if (completedDispatchId != null) {
            realtimeEventService.sendDispatchUpdate(completedDispatchId, "Mission completed");
        }
        return toDto(saved);
    }

    private static void assertPendingForAccept(MissionStatus status) {
        if (status == MissionStatus.PENDING) {
            return;
        }
        switch (status) {
            case ACCEPTED ->
                    throw new ConflictException("Cannot accept a mission that is already ACCEPTED.");
            case COMPLETED ->
                    throw new ConflictException("Cannot accept a mission that is already COMPLETED.");
            case CANCELLED ->
                    throw new ConflictException("Cannot accept a CANCELLED mission.");
            default ->
                    throw new ConflictException("Cannot accept mission in status " + status + " (expected PENDING).");
        }
    }

    private static void assertAcceptedForComplete(MissionStatus status) {
        if (status == MissionStatus.ACCEPTED) {
            return;
        }
        switch (status) {
            case PENDING ->
                    throw new ConflictException("Cannot complete a mission that is still PENDING; accept it first.");
            case COMPLETED ->
                    throw new ConflictException("Cannot complete a mission that is already COMPLETED.");
            case CANCELLED ->
                    throw new ConflictException("Cannot complete a CANCELLED mission.");
            default ->
                    throw new ConflictException("Cannot complete mission in status " + status + " (expected ACCEPTED).");
        }
    }

    private static AlertType parseAlertType(String raw) {
        try {
            return AlertType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Unknown alertType: " + raw + " (expected one of: CHUTE, FUGUE, MALAISE, COMPORTEMENT)");
        }
    }

    private MissionResponseDto toDto(Mission m) {
        return MissionResponseDto.builder()
                .id(m.getId())
                .patientId(m.getPatientId())
                .assignedMemberId(m.getAssignedMemberId())
                .alertType(m.getAlertType())
                .title(m.getTitle())
                .description(m.getDescription())
                .status(m.getStatus())
                .createdAt(m.getCreatedAt())
                .acceptedAt(m.getAcceptedAt())
                .completedAt(m.getCompletedAt())
                .stepNumber(m.getStepNumber())
                .lastAssignedAt(m.getLastAssignedAt())
                .build();
    }

    private void logMissionEmailOutcome(String kind, Long missionId, EmailSendOutcome outcome) {
        if (outcome == null) {
            log.warn("[EMAIL OUTCOME] kind={} missionId={} status=null_outcome", kind, missionId);
            return;
        }
        if (outcome.delivered()) {
            log.info(
                    "[EMAIL OUTCOME] kind={} missionId={} status=DELIVERED httpStatus={} brevoMessageId={}",
                    kind,
                    missionId,
                    outcome.httpStatus(),
                    outcome.brevoMessageId() != null ? outcome.brevoMessageId() : "(none)");
        } else {
            log.warn(
                    "[EMAIL OUTCOME] kind={} missionId={} status={} detail={} httpStatus={}",
                    kind,
                    missionId,
                    outcome.status(),
                    outcome.detail(),
                    outcome.httpStatus());
        }
    }

    private void notifyMember(Long memberId, String message, String type) {
        if (memberId == null || message == null || message.isBlank()) {
            return;
        }
        notificationService.createNotification(memberId, message, type);
        realtimeEventService.sendNotification(memberId, message);
    }
}
