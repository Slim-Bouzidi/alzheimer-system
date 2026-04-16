package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.dto.mail.EmailSendOutcome;
import com.alzheimer.supportnetwork.domain.DispatchStatus;
import com.alzheimer.supportnetwork.domain.MissionStatus;
import com.alzheimer.supportnetwork.entity.Dispatch;
import com.alzheimer.supportnetwork.entity.DispatchStepExecution;
import com.alzheimer.supportnetwork.entity.Mission;
import com.alzheimer.supportnetwork.entity.MissionActionToken;
import com.alzheimer.supportnetwork.entity.SupportMember;
import com.alzheimer.supportnetwork.repository.DispatchRepository;
import com.alzheimer.supportnetwork.repository.MissionRepository;
import com.alzheimer.supportnetwork.repository.SupportMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Automatic escalation driven by persisted {@link Dispatch} / {@link DispatchStepExecution}
 * and the linked mission remaining {@link MissionStatus#PENDING} until timeout.
 */
@Service
public class EscalationSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(EscalationSchedulerService.class);

    static final String FINAL_ESCALATION_NOTE =
            "Final escalation reached: no responder accepted in time";

    private final DispatchRepository dispatchRepository;
    private final MissionRepository missionRepository;
    private final AlertDispatchPlannerService alertDispatchPlannerService;
    private final EmailNotificationService emailNotificationService;
    private final DispatchHistoryService dispatchHistoryService;
    private final SupportMemberRepository supportMemberRepository;
    private final MissionActionTokenService missionActionTokenService;
    private final RealtimeEventService realtimeEventService;
    private final NotificationService notificationService;
    private final String adminNotificationEmail;

    public EscalationSchedulerService(
            DispatchRepository dispatchRepository,
            MissionRepository missionRepository,
            AlertDispatchPlannerService alertDispatchPlannerService,
            EmailNotificationService emailNotificationService,
            DispatchHistoryService dispatchHistoryService,
            SupportMemberRepository supportMemberRepository,
            MissionActionTokenService missionActionTokenService,
            RealtimeEventService realtimeEventService,
            NotificationService notificationService,
            @Value("${support.network.mail.admin-email:}") String adminNotificationEmail) {
        this.dispatchRepository = dispatchRepository;
        this.missionRepository = missionRepository;
        this.alertDispatchPlannerService = alertDispatchPlannerService;
        this.emailNotificationService = emailNotificationService;
        this.dispatchHistoryService = dispatchHistoryService;
        this.supportMemberRepository = supportMemberRepository;
        this.missionActionTokenService = missionActionTokenService;
        this.realtimeEventService = realtimeEventService;
        this.notificationService = notificationService;
        this.adminNotificationEmail = adminNotificationEmail;
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void tickEscalations() {
        List<Dispatch> active =
                dispatchRepository.findByStatusAndMissionIdIsNotNull(DispatchStatus.IN_PROGRESS);
        for (Dispatch dispatch : active) {
            try {
                processDispatchEscalation(dispatch.getId());
            } catch (Exception ex) {
                log.warn("[Escalation] Skipped dispatch {} due to error: {}", dispatch.getId(), ex.toString());
            }
        }
    }

    private void processDispatchEscalation(Long dispatchId) {
        Dispatch dispatch = dispatchRepository.findById(dispatchId).orElse(null);
        if (dispatch == null
                || dispatch.getStatus() != DispatchStatus.IN_PROGRESS
                || dispatch.getMissionId() == null) {
            return;
        }

        Mission mission = missionRepository.findById(dispatch.getMissionId()).orElse(null);
        if (mission == null) {
            return;
        }
        if (mission.getStatus() == MissionStatus.ACCEPTED || mission.getStatus() == MissionStatus.COMPLETED) {
            return;
        }
        if (mission.getStatus() != MissionStatus.PENDING) {
            return;
        }

        LocalDateTime anchor = mission.getLastAssignedAt();
        if (anchor == null) {
            return;
        }
        int timeoutMinutes = timeoutMinutesForCurrentStep(mission.getStepNumber());
        long elapsedMinutes = Duration.between(anchor, LocalDateTime.now()).toMinutes();
        log.info(
                "[ESCALATION CHECK] missionId={} step={} elapsedMinutes={} timeoutMinutes={}",
                mission.getId(),
                mission.getStepNumber(),
                elapsedMinutes,
                timeoutMinutes);
        if (elapsedMinutes < timeoutMinutes) {
            return;
        }

        log.info("Dispatch {} step {} timed out", dispatchId, mission.getStepNumber());
        DispatchHistoryService.ForceEscalationResult escalation =
                dispatchHistoryService.forceEscalation(
                        mission.getId(),
                        mission.getStepNumber(),
                        LocalDateTime.now(),
                        DispatchHistoryService.EscalationTrigger.SCHEDULER_TIMEOUT);

        if (escalation.finalEscalationReached()) {
            mission.setStatus(MissionStatus.CANCELLED);
            mission.setDescription(appendNote(mission.getDescription(), FINAL_ESCALATION_NOTE));
            missionRepository.save(mission);
            alertDispatchPlannerService.removeStoredPlanForMission(mission.getId());
            log.warn(
                    "[FINAL ESCALATION] dispatchId={} no more steps",
                    dispatchId);
            try {
                log.info(
                        "[BREVO TRACE] finalEscalation dispatchId={} adminNotificationEmail={}",
                        dispatchId,
                        StringUtils.hasText(adminNotificationEmail)
                                ? adminNotificationEmail.trim()
                                : "(empty)");
                EmailSendOutcome emailOutcome =
                        emailNotificationService.sendEscalationEmail(
                                adminNotificationEmail, FINAL_ESCALATION_NOTE);
                logEscalationEmailOutcome(dispatchId, emailOutcome);
            } catch (Exception ex) {
                log.error(
                        "Final escalation email path threw for dispatch {}: {}",
                        dispatchId,
                        ex.toString(),
                        ex);
            }
            return;
        }

        if (escalation.nextStepAssigned()) {
            mission.setStepNumber(escalation.nextStepNumber());
            mission.setLastAssignedAt(LocalDateTime.now());
            mission.setAssignedMemberId(escalation.nextAssigneeMemberId());
            Mission saved = missionRepository.save(mission);
            log.info(
                    "Escalating to step {} (dispatch {}, mission {})",
                    escalation.nextStepNumber(),
                    dispatchId,
                    mission.getId());
            notifyAssigneeWithEmailActionTokens(saved);
            realtimeEventService.sendMissionUpdate(saved.getAssignedMemberId(), saved);
            notificationService.createNotification(
                    saved.getAssignedMemberId(),
                    "New escalation assignment for mission #" + saved.getId() + ".",
                    "MISSION_ESCALATED");
            realtimeEventService.sendNotification(
                    saved.getAssignedMemberId(),
                    "New escalation assignment for mission #" + saved.getId() + ".");
            realtimeEventService.sendDispatchUpdate(
                    dispatchId,
                    "Escalation triggered: step " + escalation.nextStepNumber());
        }
    }

    private void notifyAssigneeWithEmailActionTokens(Mission mission) {
        if (mission.getAssignedMemberId() == null) {
            return;
        }
        SupportMember assignee = supportMemberRepository.findById(mission.getAssignedMemberId()).orElse(null);
        if (assignee == null || !StringUtils.hasText(assignee.getEmail())) {
            return;
        }
        String email = assignee.getEmail().trim();
        try {
            MissionActionToken acceptToken =
                    missionActionTokenService.createAcceptToken(mission.getId(), mission.getAssignedMemberId());
            MissionActionToken declineToken =
                    missionActionTokenService.createDeclineToken(mission.getId(), mission.getAssignedMemberId());
            log.info(
                    "[EMAIL TRIGGER] sending mission email to memberId={} email={}",
                    assignee.getId(),
                    email);
            EmailSendOutcome emailOutcome =
                    emailNotificationService.sendMissionAssignedEmail(
                            email, mission, acceptToken.getToken(), declineToken.getToken());
            if (emailOutcome.delivered()) {
                log.info(
                        "[EMAIL OUTCOME] kind=SCHEDULER_MISSION_ASSIGNED missionId={} status=DELIVERED httpStatus={}",
                        mission.getId(),
                        emailOutcome.httpStatus());
            } else {
                log.warn(
                        "[EMAIL OUTCOME] kind=SCHEDULER_MISSION_ASSIGNED missionId={} status={} detail={} httpStatus={}",
                        mission.getId(),
                        emailOutcome.status(),
                        emailOutcome.detail(),
                        emailOutcome.httpStatus());
            }
        } catch (Exception ex) {
            log.error(
                    "Mission {} scheduler reassignment email/token failed: {}",
                    mission.getId(),
                    ex.toString(),
                    ex);
        }
    }

    private void logEscalationEmailOutcome(Long dispatchId, EmailSendOutcome outcome) {
        if (outcome.delivered()) {
            log.info(
                    "[EMAIL OUTCOME] kind=FINAL_ESCALATION dispatchId={} status=DELIVERED httpStatus={}",
                    dispatchId,
                    outcome.httpStatus());
        } else {
            log.warn(
                    "[EMAIL OUTCOME] kind=FINAL_ESCALATION dispatchId={} status={} detail={} httpStatus={}",
                    dispatchId,
                    outcome.status(),
                    outcome.detail(),
                    outcome.httpStatus());
        }
    }

    private static int timeoutMinutesForCurrentStep(int stepNumber) {
        return switch (stepNumber) {
            case 1 -> 2;
            case 2 -> 3;
            default -> 4;
        };
    }

    private static String appendNote(String existing, String note) {
        if (note == null || note.isBlank()) {
            return existing;
        }
        if (existing == null || existing.isBlank()) {
            return note;
        }
        if (existing.contains(FINAL_ESCALATION_NOTE)) {
            return existing;
        }
        return existing.trim() + System.lineSeparator() + note;
    }
}
