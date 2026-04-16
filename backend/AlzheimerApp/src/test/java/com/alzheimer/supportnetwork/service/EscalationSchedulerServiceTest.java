package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.dto.mail.EmailSendOutcome;
import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.domain.DispatchStatus;
import com.alzheimer.supportnetwork.domain.MissionStatus;
import com.alzheimer.supportnetwork.entity.Dispatch;
import com.alzheimer.supportnetwork.entity.Mission;
import com.alzheimer.supportnetwork.repository.DispatchRepository;
import com.alzheimer.supportnetwork.repository.MissionRepository;
import com.alzheimer.supportnetwork.repository.SupportMemberRepository;
import com.alzheimer.supportnetwork.service.MissionActionTokenService;
import com.alzheimer.supportnetwork.service.NotificationService;
import com.alzheimer.supportnetwork.service.RealtimeEventService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("EscalationSchedulerService — escalation rules")
class EscalationSchedulerServiceTest {

    @Mock private DispatchRepository dispatchRepository;
    @Mock private MissionRepository missionRepository;
    @Mock private AlertDispatchPlannerService alertDispatchPlannerService;
    @Mock private EmailNotificationService emailNotificationService;
    @Mock private DispatchHistoryService dispatchHistoryService;
    @Mock private SupportMemberRepository supportMemberRepository;
    @Mock private MissionActionTokenService missionActionTokenService;
    @Mock private RealtimeEventService realtimeEventService;
    @Mock private NotificationService notificationService;

    private EscalationSchedulerService schedulerService;

    private Dispatch dispatch;
    private Mission mission;

    @BeforeEach
    void baseDispatchAndMission() {
        schedulerService =
                new EscalationSchedulerService(
                        dispatchRepository,
                        missionRepository,
                        alertDispatchPlannerService,
                        emailNotificationService,
                        dispatchHistoryService,
                        supportMemberRepository,
                        missionActionTokenService,
                        realtimeEventService,
                        notificationService,
                        "coord@example.com");
        lenient()
                .when(emailNotificationService.sendEscalationEmail(any(), any()))
                .thenReturn(EmailSendOutcome.success(201, "unit-test"));
        lenient()
                .when(emailNotificationService.sendMissionAssignedEmail(any(), any(), any(), any()))
                .thenReturn(EmailSendOutcome.success(201, "unit-test"));
        dispatch =
                Dispatch.builder()
                        .id(100L)
                        .patientId(1L)
                        .alertType(AlertType.MALAISE)
                        .generatedAt(LocalDateTime.now().minusHours(1))
                        .status(DispatchStatus.IN_PROGRESS)
                        .missionId(50L)
                        .build();
        mission =
                Mission.builder()
                        .id(50L)
                        .patientId(1L)
                        .assignedMemberId(1000L)
                        .alertType(AlertType.MALAISE)
                        .title("t")
                        .status(MissionStatus.PENDING)
                        .stepNumber(1)
                        .lastAssignedAt(LocalDateTime.now().minusMinutes(30))
                        .createdAt(LocalDateTime.now().minusHours(2))
                        .build();
    }

    @Test
    @DisplayName("GIVEN mission ACCEPTED WHEN tick THEN mission not updated for escalation")
    void shouldNotEscalateIfMissionAccepted() {
        // GIVEN
        mission.setStatus(MissionStatus.ACCEPTED);
        when(dispatchRepository.findByStatusAndMissionIdIsNotNull(DispatchStatus.IN_PROGRESS))
                .thenReturn(List.of(dispatch));
        when(dispatchRepository.findById(100L)).thenReturn(Optional.of(dispatch));
        when(missionRepository.findById(50L)).thenReturn(Optional.of(mission));

        // WHEN
        schedulerService.tickEscalations();

        // THEN
        verify(missionRepository, never()).save(any());
        verify(dispatchHistoryService, never()).forceEscalation(anyLong(), anyInt(), any(), any());
    }

    @Test
    @DisplayName("GIVEN step1 timed out and step2 pending WHEN tick THEN mission moves to step2 and assignee updated")
    void shouldEscalateWhenTimeoutReachedAndMoveToNextStep() {
        // GIVEN
        when(dispatchRepository.findByStatusAndMissionIdIsNotNull(DispatchStatus.IN_PROGRESS))
                .thenReturn(List.of(dispatch));
        when(dispatchRepository.findById(100L)).thenReturn(Optional.of(dispatch));
        when(missionRepository.findById(50L)).thenReturn(Optional.of(mission));
        when(dispatchHistoryService.forceEscalation(
                eq(50L),
                eq(1),
                any(LocalDateTime.class),
                eq(DispatchHistoryService.EscalationTrigger.SCHEDULER_TIMEOUT)))
                .thenReturn(DispatchHistoryService.ForceEscalationResult.nextStep(
                        2000L,
                        2,
                        DispatchHistoryService.EscalationTrigger.SCHEDULER_TIMEOUT));
        when(missionRepository.save(any(Mission.class))).thenAnswer(inv -> inv.getArgument(0));

        // WHEN
        schedulerService.tickEscalations();

        // THEN
        ArgumentCaptor<Mission> missionCaptor = ArgumentCaptor.forClass(Mission.class);
        verify(missionRepository).save(missionCaptor.capture());
        Mission updated = missionCaptor.getValue();
        assertThat(updated.getStepNumber()).isEqualTo(2);
        assertThat(updated.getAssignedMemberId()).isEqualTo(2000L);
        verify(dispatchHistoryService).forceEscalation(
                eq(50L),
                eq(1),
                any(LocalDateTime.class),
                eq(DispatchHistoryService.EscalationTrigger.SCHEDULER_TIMEOUT));
    }

    @Test
    @DisplayName("GIVEN final step timed out and no next step WHEN tick THEN dispatch ESCALATED and mission CANCELLED")
    void shouldMarkDispatchEscalatedWhenNoMoreSteps() {
        // GIVEN
        mission.setStepNumber(3);
        mission.setLastAssignedAt(LocalDateTime.now().minusMinutes(60));
        when(dispatchRepository.findByStatusAndMissionIdIsNotNull(DispatchStatus.IN_PROGRESS))
                .thenReturn(List.of(dispatch));
        when(dispatchRepository.findById(100L)).thenReturn(Optional.of(dispatch));
        when(missionRepository.findById(50L)).thenReturn(Optional.of(mission));
        when(dispatchHistoryService.forceEscalation(
                eq(50L),
                eq(3),
                any(LocalDateTime.class),
                eq(DispatchHistoryService.EscalationTrigger.SCHEDULER_TIMEOUT)))
                .thenReturn(DispatchHistoryService.ForceEscalationResult.finalEscalated());

        // WHEN
        schedulerService.tickEscalations();

        // THEN
        verify(dispatchHistoryService).forceEscalation(
                eq(50L),
                eq(3),
                any(LocalDateTime.class),
                eq(DispatchHistoryService.EscalationTrigger.SCHEDULER_TIMEOUT));

        ArgumentCaptor<Mission> missionCaptor = ArgumentCaptor.forClass(Mission.class);
        verify(missionRepository).save(missionCaptor.capture());
        assertThat(missionCaptor.getValue().getStatus()).isEqualTo(MissionStatus.CANCELLED);

        verify(alertDispatchPlannerService).removeStoredPlanForMission(50L);
        verify(emailNotificationService)
                .sendEscalationEmail(any(), eq(EscalationSchedulerService.FINAL_ESCALATION_NOTE));
    }
}
