package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.domain.DispatchStatus;
import com.alzheimer.supportnetwork.domain.DispatchStepStatus;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchAssigneeDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchPlanDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchStepDto;
import com.alzheimer.supportnetwork.entity.Dispatch;
import com.alzheimer.supportnetwork.entity.DispatchStepExecution;
import com.alzheimer.supportnetwork.repository.DispatchRepository;
import com.alzheimer.supportnetwork.repository.DispatchStepExecutionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DispatchHistoryService — persistence & status transitions")
class DispatchHistoryServiceTest {

    @Mock private DispatchRepository dispatchRepository;
    @Mock private DispatchStepExecutionRepository dispatchStepExecutionRepository;

    @InjectMocks private DispatchHistoryService dispatchHistoryService;

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 6, 1, 9, 0);

    @Test
    @DisplayName("GIVEN plan WHEN persist THEN dispatch saved and step rows created with correct ASSIGNED/PENDING")
    void shouldPersistDispatchAndAssignSteps() {
        // GIVEN
        Dispatch savedHeader = Dispatch.builder().id(77L).patientId(3L).alertType(AlertType.CHUTE).generatedAt(NOW).status(DispatchStatus.CREATED).missionId(null).build();
        when(dispatchRepository.save(any(Dispatch.class)))
                .thenAnswer(
                        inv -> {
                            Dispatch d = inv.getArgument(0);
                            if (d.getId() == null) {
                                d.setId(77L);
                            }
                            return d;
                        });
        when(dispatchRepository.findById(77L)).thenReturn(Optional.of(savedHeader));

        DispatchPlanDto plan =
                DispatchPlanDto.builder()
                        .patientId(3L)
                        .alertType(AlertType.CHUTE)
                        .generatedAt(NOW)
                        .steps(
                                List.of(
                                        DispatchStepDto.builder()
                                                .stepNumber(1)
                                                .timeoutMinutes(2)
                                                .assignees(
                                                        List.of(
                                                                assignee(10L, "Primary"),
                                                                assignee(11L, "Backup")))
                                                .build(),
                                        DispatchStepDto.builder()
                                                .stepNumber(2)
                                                .timeoutMinutes(3)
                                                .assignees(List.of(assignee(12L, "Esc")))
                                                .build()))
                        .build();

        // WHEN
        Dispatch result = dispatchHistoryService.persistDispatchSnapshot(plan, 3L, AlertType.CHUTE, NOW, 10L);

        // THEN
        assertThat(result.getId()).isEqualTo(77L);
        verify(dispatchRepository).save(any(Dispatch.class));
        ArgumentCaptor<DispatchStepExecution> rowCaptor = ArgumentCaptor.forClass(DispatchStepExecution.class);
        verify(dispatchStepExecutionRepository, times(3)).save(rowCaptor.capture());
        List<DispatchStepExecution> rows = rowCaptor.getAllValues();
        long assignedCount = rows.stream().filter(r -> r.getStatus() == DispatchStepStatus.ASSIGNED).count();
        long pendingCount = rows.stream().filter(r -> r.getStatus() == DispatchStepStatus.PENDING).count();
        assertThat(assignedCount).isEqualTo(1);
        assertThat(pendingCount).isEqualTo(2);
        assertThat(rows.stream().filter(r -> r.getStepNumber() == 1 && r.getAssigneeMemberId() == 10L).findFirst().orElseThrow().getStatus())
                .isEqualTo(DispatchStepStatus.ASSIGNED);
    }

    @Test
    @DisplayName("GIVEN dispatch WHEN attachMission THEN missionId set and status IN_PROGRESS")
    void shouldLinkMissionId() {
        Dispatch d = Dispatch.builder().id(5L).patientId(1L).alertType(AlertType.MALAISE).generatedAt(NOW).status(DispatchStatus.CREATED).missionId(null).build();
        when(dispatchRepository.findById(5L)).thenReturn(Optional.of(d));
        when(dispatchRepository.save(any(Dispatch.class))).thenAnswer(inv -> inv.getArgument(0));

        dispatchHistoryService.attachMission(5L, 999L);

        ArgumentCaptor<Dispatch> cap = ArgumentCaptor.forClass(Dispatch.class);
        verify(dispatchRepository).save(cap.capture());
        assertThat(cap.getValue().getMissionId()).isEqualTo(999L);
        assertThat(cap.getValue().getStatus()).isEqualTo(DispatchStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("GIVEN IN_PROGRESS dispatch WHEN onMissionAccepted THEN dispatch COMPLETED and ASSIGNED rows ACCEPTED")
    void shouldUpdateStatusOnAccept() {
        Dispatch d =
                Dispatch.builder()
                        .id(8L)
                        .patientId(1L)
                        .alertType(AlertType.MALAISE)
                        .generatedAt(NOW)
                        .status(DispatchStatus.IN_PROGRESS)
                        .missionId(200L)
                        .build();
        when(dispatchRepository.findByMissionId(200L)).thenReturn(Optional.of(d));
        DispatchStepExecution row =
                DispatchStepExecution.builder()
                        .id(50L)
                        .dispatch(d)
                        .stepNumber(1)
                        .timeoutMinutes(2)
                        .assigneeMemberId(1L)
                        .assigneeName("X")
                        .status(DispatchStepStatus.ASSIGNED)
                        .startedAt(NOW)
                        .build();
        when(dispatchStepExecutionRepository.findByDispatch_IdOrderByStepNumberAscIdAsc(8L)).thenReturn(List.of(row));

        dispatchHistoryService.onMissionAccepted(200L);

        ArgumentCaptor<Dispatch> dCap = ArgumentCaptor.forClass(Dispatch.class);
        verify(dispatchRepository).save(dCap.capture());
        assertThat(dCap.getValue().getStatus()).isEqualTo(DispatchStatus.COMPLETED);
        ArgumentCaptor<DispatchStepExecution> eCap = ArgumentCaptor.forClass(DispatchStepExecution.class);
        verify(dispatchStepExecutionRepository).save(eCap.capture());
        assertThat(eCap.getValue().getStatus()).isEqualTo(DispatchStepStatus.ACCEPTED);
    }

    @Test
    @DisplayName("GIVEN dispatch WHEN onMissionCompleted THEN ACCEPTED rows become COMPLETED")
    void shouldUpdateStatusOnComplete() {
        Dispatch d =
                Dispatch.builder()
                        .id(9L)
                        .patientId(1L)
                        .alertType(AlertType.MALAISE)
                        .generatedAt(NOW)
                        .status(DispatchStatus.COMPLETED)
                        .missionId(201L)
                        .build();
        when(dispatchRepository.findByMissionId(201L)).thenReturn(Optional.of(d));
        DispatchStepExecution row =
                DispatchStepExecution.builder()
                        .id(60L)
                        .dispatch(d)
                        .stepNumber(1)
                        .timeoutMinutes(2)
                        .assigneeMemberId(1L)
                        .assigneeName("X")
                        .status(DispatchStepStatus.ACCEPTED)
                        .startedAt(NOW)
                        .build();
        when(dispatchStepExecutionRepository.findByDispatch_IdOrderByStepNumberAscIdAsc(9L)).thenReturn(List.of(row));

        dispatchHistoryService.onMissionCompleted(201L);

        ArgumentCaptor<DispatchStepExecution> eCap = ArgumentCaptor.forClass(DispatchStepExecution.class);
        verify(dispatchStepExecutionRepository).save(eCap.capture());
        assertThat(eCap.getValue().getStatus()).isEqualTo(DispatchStepStatus.COMPLETED);
    }

    @Test
    @DisplayName("GIVEN IN_PROGRESS dispatch WHEN assignee declines AND next step exists THEN next step ASSIGNED")
    void assigneeDeclineEscalatesToNextStep() {
        Dispatch d =
                Dispatch.builder()
                        .id(10L)
                        .patientId(1L)
                        .alertType(AlertType.MALAISE)
                        .generatedAt(NOW)
                        .status(DispatchStatus.IN_PROGRESS)
                        .missionId(99L)
                        .build();
        when(dispatchRepository.findByMissionId(99L)).thenReturn(Optional.of(d));
        DispatchStepExecution s1a =
                DispatchStepExecution.builder()
                        .id(1L)
                        .dispatch(d)
                        .stepNumber(1)
                        .timeoutMinutes(2)
                        .assigneeMemberId(10L)
                        .assigneeName("A")
                        .status(DispatchStepStatus.ASSIGNED)
                        .startedAt(NOW)
                        .build();
        DispatchStepExecution s1p =
                DispatchStepExecution.builder()
                        .id(2L)
                        .dispatch(d)
                        .stepNumber(1)
                        .timeoutMinutes(2)
                        .assigneeMemberId(11L)
                        .assigneeName("B")
                        .status(DispatchStepStatus.PENDING)
                        .startedAt(NOW)
                        .build();
        DispatchStepExecution s2p =
                DispatchStepExecution.builder()
                        .id(3L)
                        .dispatch(d)
                        .stepNumber(2)
                        .timeoutMinutes(3)
                        .assigneeMemberId(12L)
                        .assigneeName("C")
                        .status(DispatchStepStatus.PENDING)
                        .startedAt(NOW)
                        .build();
        when(dispatchStepExecutionRepository.findByDispatch_IdOrderByStepNumberAscIdAsc(10L))
                .thenReturn(List.of(s1a, s1p, s2p));

        DispatchHistoryService.AssigneeDeclineResult r =
                dispatchHistoryService.handleAssigneeDeclined(99L, 10L, 1, NOW);

        assertThat(r.escalatedToNextResponder()).isTrue();
        assertThat(r.nextAssigneeMemberId()).isEqualTo(12L);
        assertThat(r.nextStepNumber()).isEqualTo(2);
        assertThat(s1a.getStatus()).isEqualTo(DispatchStepStatus.SKIPPED);
        assertThat(s2p.getStatus()).isEqualTo(DispatchStepStatus.ASSIGNED);
    }

    @Test
    @DisplayName("GIVEN IN_PROGRESS dispatch WHEN assignee declines AND no next step THEN dispatch ESCALATED")
    void assigneeDeclineClosesWhenNoNextStep() {
        Dispatch d =
                Dispatch.builder()
                        .id(11L)
                        .patientId(1L)
                        .alertType(AlertType.MALAISE)
                        .generatedAt(NOW)
                        .status(DispatchStatus.IN_PROGRESS)
                        .missionId(100L)
                        .build();
        when(dispatchRepository.findByMissionId(100L)).thenReturn(Optional.of(d));
        when(dispatchRepository.save(any(Dispatch.class))).thenAnswer(inv -> inv.getArgument(0));
        DispatchStepExecution s1a =
                DispatchStepExecution.builder()
                        .id(20L)
                        .dispatch(d)
                        .stepNumber(1)
                        .timeoutMinutes(2)
                        .assigneeMemberId(10L)
                        .assigneeName("A")
                        .status(DispatchStepStatus.ASSIGNED)
                        .startedAt(NOW)
                        .build();
        when(dispatchStepExecutionRepository.findByDispatch_IdOrderByStepNumberAscIdAsc(11L))
                .thenReturn(List.of(s1a))
                .thenReturn(List.of(s1a));

        DispatchHistoryService.AssigneeDeclineResult r =
                dispatchHistoryService.handleAssigneeDeclined(100L, 10L, 1, NOW);

        assertThat(r.escalatedToNextResponder()).isFalse();
        ArgumentCaptor<Dispatch> dCap = ArgumentCaptor.forClass(Dispatch.class);
        verify(dispatchRepository).save(dCap.capture());
        assertThat(dCap.getValue().getStatus()).isEqualTo(DispatchStatus.ESCALATED);
    }

    private static DispatchAssigneeDto assignee(Long memberId, String name) {
        return DispatchAssigneeDto.builder().memberId(memberId).fullName(name).type("FAMILY").score(1).reasons(List.of()).build();
    }
}
