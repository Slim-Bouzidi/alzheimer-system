package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.dto.mail.EmailSendOutcome;
import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.domain.MissionStatus;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchPlanDto;
import com.alzheimer.supportnetwork.dto.mission.MissionDispatchRequestDto;
import com.alzheimer.supportnetwork.dto.mission.MissionResponseDto;
import com.alzheimer.supportnetwork.entity.Dispatch;
import com.alzheimer.supportnetwork.entity.Mission;
import com.alzheimer.supportnetwork.entity.MissionActionToken;
import com.alzheimer.supportnetwork.entity.Patient;
import com.alzheimer.supportnetwork.entity.SupportMember;
import com.alzheimer.supportnetwork.exception.ConflictException;
import com.alzheimer.supportnetwork.repository.MissionRepository;
import com.alzheimer.supportnetwork.repository.PatientRepository;
import com.alzheimer.supportnetwork.repository.SupportMemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("MissionService — business rules")
class MissionServiceTest {

    @Mock private MissionRepository missionRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private SupportMemberRepository supportMemberRepository;
    @Mock private AlertDispatchPlannerService alertDispatchPlannerService;
    @Mock private DispatchHistoryService dispatchHistoryService;
    @Mock private EmailNotificationService emailNotificationService;
    @Mock private MissionActionTokenService missionActionTokenService;
    @Mock private RealtimeEventService realtimeEventService;
    @Mock private NotificationService notificationService;

    @InjectMocks private MissionService missionService;

    private final LocalDateTime fixedNow = LocalDateTime.of(2026, 4, 14, 12, 0);

    @BeforeEach
    void setUp() {
        lenient()
                .when(emailNotificationService.sendMissionAssignedEmail(any(), any(), any(), any()))
                .thenReturn(EmailSendOutcome.success(201, "unit-test"));
        lenient()
                .when(emailNotificationService.sendEscalationEmail(any(), any()))
                .thenReturn(EmailSendOutcome.success(201, "unit-test"));
        when(alertDispatchPlannerService.generatePlan(any())).thenReturn(DispatchPlanDto.builder().steps(java.util.List.of()).build());
        lenient()
                .when(dispatchHistoryService.persistDispatchSnapshot(any(), anyLong(), any(), any(), anyLong()))
                .thenReturn(Dispatch.builder().id(700L).patientId(1L).build());
        lenient().doNothing().when(dispatchHistoryService).attachMission(anyLong(), anyLong());
        when(missionActionTokenService.createAcceptToken(anyLong(), anyLong()))
                .thenAnswer(inv -> MissionActionToken.builder()
                        .token("email-accept-token")
                        .missionId(inv.getArgument(0))
                        .memberId(inv.getArgument(1))
                        .build());
        when(missionActionTokenService.createDeclineToken(anyLong(), anyLong()))
                .thenAnswer(inv -> MissionActionToken.builder()
                        .token("email-decline-token")
                        .missionId(inv.getArgument(0))
                        .memberId(inv.getArgument(1))
                        .build());
    }

    @Nested
    @DisplayName("acceptMission")
    class AcceptMission {

        @Test
        @DisplayName("GIVEN mission PENDING WHEN accept THEN status ACCEPTED and dispatch notified")
        void shouldSucceedWhenStatusPending() {
            // GIVEN
            Mission m = baseMission(1L, MissionStatus.PENDING);
            when(missionRepository.findById(1L)).thenReturn(Optional.of(m));
            when(missionRepository.save(any(Mission.class))).thenAnswer(inv -> inv.getArgument(0));

            // WHEN
            MissionResponseDto dto = missionService.acceptMission(1L);

            // THEN
            assertThat(dto.getStatus()).isEqualTo(MissionStatus.ACCEPTED);
            verify(dispatchHistoryService).onMissionAccepted(1L);
            verify(alertDispatchPlannerService).removeStoredPlanForMission(1L);
        }

        @Test
        @DisplayName("GIVEN mission COMPLETED WHEN accept THEN ConflictException")
        void shouldFailWhenStatusCompleted() {
            Mission m = baseMission(2L, MissionStatus.COMPLETED);
            when(missionRepository.findById(2L)).thenReturn(Optional.of(m));

            assertThrows(ConflictException.class, () -> missionService.acceptMission(2L));
            verify(missionRepository, never()).save(any());
        }

        @Test
        @DisplayName("GIVEN mission ACCEPTED WHEN accept THEN ConflictException")
        void shouldFailWhenStatusAccepted() {
            Mission m = baseMission(3L, MissionStatus.ACCEPTED);
            when(missionRepository.findById(3L)).thenReturn(Optional.of(m));

            assertThrows(ConflictException.class, () -> missionService.acceptMission(3L));
            verify(missionRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("completeMission")
    class CompleteMission {

        @Test
        @DisplayName("GIVEN mission ACCEPTED WHEN complete THEN status COMPLETED")
        void shouldSucceedWhenStatusAccepted() {
            Mission m = baseMission(10L, MissionStatus.ACCEPTED);
            when(missionRepository.findById(10L)).thenReturn(Optional.of(m));
            when(missionRepository.save(any(Mission.class))).thenAnswer(inv -> inv.getArgument(0));

            MissionResponseDto dto = missionService.completeMission(10L);

            assertThat(dto.getStatus()).isEqualTo(MissionStatus.COMPLETED);
            verify(dispatchHistoryService).onMissionCompleted(10L);
        }

        @Test
        @DisplayName("GIVEN mission PENDING WHEN complete THEN ConflictException")
        void shouldFailWhenStatusPending() {
            Mission m = baseMission(11L, MissionStatus.PENDING);
            when(missionRepository.findById(11L)).thenReturn(Optional.of(m));

            assertThrows(ConflictException.class, () -> missionService.completeMission(11L));
            verify(missionRepository, never()).save(any());
        }

        @Test
        @DisplayName("GIVEN mission COMPLETED WHEN complete THEN ConflictException")
        void shouldFailWhenStatusCompleted() {
            Mission m = baseMission(12L, MissionStatus.COMPLETED);
            when(missionRepository.findById(12L)).thenReturn(Optional.of(m));

            assertThrows(ConflictException.class, () -> missionService.completeMission(12L));
            verify(missionRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("dispatchMission")
    class DispatchMission {

        @Test
        @DisplayName("GIVEN valid patient and member WHEN dispatch THEN mission PENDING, member assigned, email sent")
        void shouldCreatePendingMissionAssignMemberAndNotifyEmail() {
            // GIVEN
            when(patientRepository.findById(1L)).thenReturn(Optional.of(new Patient()));
            SupportMember member = SupportMember.builder()
                    .id(5L)
                    .fullName("Alice")
                    .email("alice@example.com")
                    .build();
            when(supportMemberRepository.findById(5L)).thenReturn(Optional.of(member));
            when(missionRepository.save(any(Mission.class))).thenAnswer(inv -> {
                Mission arg = inv.getArgument(0);
                arg.setId(99L);
                return arg;
            });

            MissionDispatchRequestDto req = MissionDispatchRequestDto.builder()
                    .patientId(1L)
                    .assignedMemberId(5L)
                    .alertType("MALAISE")
                    .title("  Urgence  ")
                    .description(" desc ")
                    .build();

            // WHEN
            MissionResponseDto dto = missionService.dispatchMission(req, fixedNow);

            // THEN
            assertThat(dto.getStatus()).isEqualTo(MissionStatus.PENDING);
            assertThat(dto.getAssignedMemberId()).isEqualTo(5L);
            assertThat(dto.getPatientId()).isEqualTo(1L);
            assertThat(dto.getTitle()).isEqualTo("Urgence");

            ArgumentCaptor<Mission> captor = ArgumentCaptor.forClass(Mission.class);
            verify(missionRepository).save(captor.capture());
            Mission saved = captor.getValue();
            assertThat(saved.getStatus()).isEqualTo(MissionStatus.PENDING);
            assertThat(saved.getAssignedMemberId()).isEqualTo(5L);
            assertThat(saved.getAlertType()).isEqualTo(AlertType.MALAISE);

            verify(missionActionTokenService).createAcceptToken(99L, 5L);
            verify(missionActionTokenService).createDeclineToken(99L, 5L);
            verify(emailNotificationService)
                    .sendMissionAssignedEmail(
                            eq("alice@example.com"),
                            any(Mission.class),
                            eq("email-accept-token"),
                            eq("email-decline-token"));
            verify(alertDispatchPlannerService).storePlanForMission(eq(99L), any(DispatchPlanDto.class));
            verify(dispatchHistoryService).persistDispatchSnapshot(any(), eq(1L), eq(AlertType.MALAISE), eq(fixedNow), eq(5L));
            verify(dispatchHistoryService).attachMission(700L, 99L);
            verify(realtimeEventService).sendDispatchUpdate(eq(700L), any());
        }

        @Test
        @DisplayName("GIVEN PENDING mission WHEN decline AND no next step THEN mission CANCELLED and plan removed")
        void declineCancelsWhenDispatchSaysNoEscalation() {
            Mission m = baseMission(1L, MissionStatus.PENDING);
            when(missionRepository.findById(1L)).thenReturn(Optional.of(m));
            when(missionRepository.save(any(Mission.class))).thenAnswer(inv -> inv.getArgument(0));
            when(dispatchHistoryService.handleAssigneeDeclined(eq(1L), eq(2L), eq(1), any()))
                    .thenReturn(DispatchHistoryService.AssigneeDeclineResult.cancelMissionOnly());

            MissionResponseDto dto = missionService.declineMission(1L);

            assertThat(dto.getStatus()).isEqualTo(MissionStatus.CANCELLED);
            verify(alertDispatchPlannerService).removeStoredPlanForMission(1L);
            verify(dispatchHistoryService).handleAssigneeDeclined(eq(1L), eq(2L), eq(1), any());
        }

        @Test
        @DisplayName("GIVEN PENDING mission WHEN decline AND next step THEN mission stays PENDING and email to next")
        void declineEscalatesAndEmailsNextAssignee() {
            Mission m = baseMission(1L, MissionStatus.PENDING);
            when(missionRepository.findById(1L)).thenReturn(Optional.of(m));
            when(missionRepository.save(any(Mission.class))).thenAnswer(inv -> inv.getArgument(0));
            when(dispatchHistoryService.handleAssigneeDeclined(eq(1L), eq(2L), eq(1), any()))
                    .thenReturn(DispatchHistoryService.AssigneeDeclineResult.escalated(8L, 2));
            SupportMember next =
                    SupportMember.builder().id(8L).fullName("Bob").email("bob@example.com").build();
            when(supportMemberRepository.findById(8L)).thenReturn(Optional.of(next));

            MissionResponseDto dto = missionService.declineMission(1L);

            assertThat(dto.getStatus()).isEqualTo(MissionStatus.PENDING);
            assertThat(dto.getAssignedMemberId()).isEqualTo(8L);
            assertThat(dto.getStepNumber()).isEqualTo(2);
            verify(emailNotificationService)
                    .sendMissionAssignedEmail(
                            eq("bob@example.com"), any(Mission.class), eq("email-accept-token"), eq("email-decline-token"));
        }
    }

    private static Mission baseMission(Long id, MissionStatus status) {
        return Mission.builder()
                .id(id)
                .patientId(1L)
                .assignedMemberId(2L)
                .alertType(AlertType.MALAISE)
                .title("t")
                .status(status)
                .stepNumber(1)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
