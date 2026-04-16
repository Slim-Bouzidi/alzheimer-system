package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.dto.alert.AlertTriggerRequestDto;
import com.alzheimer.supportnetwork.dto.alert.AlertTriggerResponseDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchAssigneeDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchPlanDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchPlanRequestDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchStepDto;
import com.alzheimer.supportnetwork.dto.mail.EmailSendOutcome;
import com.alzheimer.supportnetwork.dto.engine.BestIntervenantsRequestDto;
import com.alzheimer.supportnetwork.dto.engine.BestIntervenantsResponseDto;
import com.alzheimer.supportnetwork.dto.mission.MissionDispatchRequestDto;
import com.alzheimer.supportnetwork.dto.mission.MissionResponseDto;
import com.alzheimer.supportnetwork.exception.NotFoundException;
import com.alzheimer.supportnetwork.repository.PatientRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Orchestrates alert handling over existing services: best intervenants → dispatch plan → mission.
 */
@Service
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);
    private static final String AUTO_TITLE = "Auto-dispatched alert";

    private final SupportNetworkEngineService supportNetworkEngineService;
    private final AlertDispatchPlannerService alertDispatchPlannerService;
    private final MissionService missionService;
    private final PatientRepository patientRepository;
    private final EmailNotificationService emailNotificationService;
    private final String adminNotificationEmail;

    public AlertService(
            SupportNetworkEngineService supportNetworkEngineService,
            AlertDispatchPlannerService alertDispatchPlannerService,
            MissionService missionService,
            PatientRepository patientRepository,
            EmailNotificationService emailNotificationService,
            @Value("${support.network.mail.admin-email:}") String adminNotificationEmail) {
        this.supportNetworkEngineService = supportNetworkEngineService;
        this.alertDispatchPlannerService = alertDispatchPlannerService;
        this.missionService = missionService;
        this.patientRepository = patientRepository;
        this.emailNotificationService = emailNotificationService;
        this.adminNotificationEmail = adminNotificationEmail;
    }

    @Transactional
    public AlertTriggerResponseDto triggerAlert(AlertTriggerRequestDto dto) {
        Long patientId = dto.getPatientId();
        if (patientId == null) {
            throw new IllegalArgumentException("patientId is required");
        }
        if (!patientRepository.existsById(patientId)) {
            throw new NotFoundException("Patient not found: " + patientId);
        }

        AlertType alertType = parseAlertType(dto.getAlertType());
        LocalDateTime now = LocalDateTime.now();

        BestIntervenantsResponseDto ranking = supportNetworkEngineService.rankBestIntervenants(
                BestIntervenantsRequestDto.builder()
                        .patientId(patientId)
                        .now(now)
                        .alertType(alertType)
                        .build());

        if (ranking.getItems() == null || ranking.getItems().isEmpty()) {
            throw new IllegalArgumentException(
                    "No ranked intervenants for this patient (no network links or empty ranking).");
        }

        DispatchPlanDto plan = alertDispatchPlannerService.generatePlan(
                DispatchPlanRequestDto.builder()
                        .patientId(patientId)
                        .alertType(alertType)
                        .now(now)
                        .build());

        DispatchAssigneeDto selected = firstAssigneeFromStepOne(plan);
        if (selected == null || selected.getMemberId() == null) {
            throw new IllegalArgumentException(
                    "Dispatch step 1 has no assignee (empty plan or no eligible candidate for this alert).");
        }

        // Dispatch history rows are created inside MissionService.dispatchMission (avoid duplicate headers).
        MissionResponseDto mission = missionService.dispatchMission(
                MissionDispatchRequestDto.builder()
                        .patientId(patientId)
                        .assignedMemberId(selected.getMemberId())
                        .alertType(alertType.name())
                        .title(AUTO_TITLE)
                        .description(dto.getDescription())
                        .build(),
                now);

        try {
            log.info(
                    "[BREVO TRACE] alert patientId={} adminNotificationEmail={} (alert emails always use this address, not the assignee)",
                    patientId,
                    StringUtils.hasText(adminNotificationEmail) ? adminNotificationEmail.trim() : "(empty)");
            EmailSendOutcome emailOutcome =
                    emailNotificationService.sendAlertTriggeredEmail(
                            adminNotificationEmail, patientId, alertType.name());
            if (emailOutcome.delivered()) {
                log.info(
                        "[EMAIL OUTCOME] kind=ALERT_TRIGGERED patientId={} status=DELIVERED httpStatus={}",
                        patientId,
                        emailOutcome.httpStatus());
            } else {
                log.warn(
                        "[EMAIL OUTCOME] kind=ALERT_TRIGGERED patientId={} status={} detail={} httpStatus={}",
                        patientId,
                        emailOutcome.status(),
                        emailOutcome.detail(),
                        emailOutcome.httpStatus());
            }
        } catch (Exception ex) {
            log.error(
                    "Alert trigger email path threw for patient {}: {}",
                    patientId,
                    ex.toString(),
                    ex);
        }

        return AlertTriggerResponseDto.builder()
                .mission(mission)
                .selectedIntervenant(selected)
                .dispatchPlan(plan)
                .build();
    }

    private static DispatchAssigneeDto firstAssigneeFromStepOne(DispatchPlanDto plan) {
        if (plan == null || plan.getSteps() == null || plan.getSteps().isEmpty()) {
            return null;
        }
        return plan.getSteps().stream()
                .filter(s -> s.getStepNumber() == 1)
                .findFirst()
                .map(DispatchStepDto::getAssignees)
                .filter(list -> list != null && !list.isEmpty())
                .map(list -> list.get(0))
                .orElse(null);
    }

    private static AlertType parseAlertType(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("alertType is required");
        }
        try {
            return AlertType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid alertType: "
                            + raw
                            + ". Expected one of: CHUTE, FUGUE, MALAISE, COMPORTEMENT.");
        }
    }
}
