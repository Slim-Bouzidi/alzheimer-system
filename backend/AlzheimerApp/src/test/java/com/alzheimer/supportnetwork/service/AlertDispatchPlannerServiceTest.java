package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchPlanDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchPlanRequestDto;
import com.alzheimer.supportnetwork.dto.dispatch.DispatchStepDto;
import com.alzheimer.supportnetwork.dto.engine.BestIntervenantsResponseDto;
import com.alzheimer.supportnetwork.dto.engine.RankedIntervenantDto;
import com.alzheimer.supportnetwork.entity.Patient;
import com.alzheimer.supportnetwork.entity.PatientSupportLink;
import com.alzheimer.supportnetwork.entity.SupportMember;
import com.alzheimer.supportnetwork.repository.PatientSupportLinkRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AlertDispatchPlannerService — multi-step plan")
class AlertDispatchPlannerServiceTest {

    @Mock private SupportNetworkEngineService supportNetworkEngineService;
    @Mock private PatientSupportLinkRepository linkRepository;

    @InjectMocks private AlertDispatchPlannerService plannerService;

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 5, 1, 10, 0);

    @Test
    @DisplayName("GIVEN ranked candidates WHEN generatePlan THEN multi-step ordered plan with assignees and timeouts")
    void shouldBuildMultiStepPlanOrderedWithAssigneesAndTimeouts() {
        // GIVEN
        Patient patient = new Patient();
        patient.setId(7L);
        SupportMember m1 = member(1L, "A");
        SupportMember m2 = member(2L, "B");
        SupportMember m3 = member(3L, "C");
        SupportMember m4 = member(4L, "D");
        SupportMember m5 = member(5L, "E");
        SupportMember m6 = member(6L, "F");
        when(linkRepository.findByPatient_Id(7L))
                .thenReturn(
                        List.of(
                                link(patient, m1),
                                link(patient, m2),
                                link(patient, m3),
                                link(patient, m4),
                                link(patient, m5),
                                link(patient, m6)));

        List<RankedIntervenantDto> ranked = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            ranked.add(
                    RankedIntervenantDto.builder()
                            .memberId((long) i)
                            .fullName("M" + i)
                            .type("FAMILY")
                            .score(100 - i)
                            .reasons(List.of("r"))
                            .availableNow(true)
                            .build());
        }
        when(supportNetworkEngineService.rankBestIntervenants(any()))
                .thenReturn(
                        BestIntervenantsResponseDto.builder()
                                .patientId(7L)
                                .generatedAt(NOW)
                                .items(ranked)
                                .build());

        // WHEN
        DispatchPlanDto plan =
                plannerService.generatePlan(
                        DispatchPlanRequestDto.builder()
                                .patientId(7L)
                                .alertType(AlertType.MALAISE)
                                .now(NOW)
                                .build());

        // THEN
        assertThat(plan.getSteps()).isNotEmpty();
        List<DispatchStepDto> steps = plan.getSteps();
        assertThat(steps.stream().map(DispatchStepDto::getStepNumber).toList())
                .containsExactly(1, 2, 3);
        assertThat(steps.get(0).getTimeoutMinutes()).isEqualTo(2);
        assertThat(steps.get(1).getTimeoutMinutes()).isEqualTo(3);
        assertThat(steps.get(2).getTimeoutMinutes()).isEqualTo(4);

        assertThat(steps.get(0).getAssignees()).hasSize(1);
        assertThat(steps.get(1).getAssignees()).hasSize(2);
        assertThat(steps.get(2).getAssignees()).hasSize(3);
        assertThat(steps.get(0).getAssignees().get(0).getMemberId()).isEqualTo(1L);
    }

    private static SupportMember member(Long id, String name) {
        SupportMember m = new SupportMember();
        m.setId(id);
        m.setFullName(name);
        return m;
    }

    private static PatientSupportLink link(Patient patient, SupportMember member) {
        PatientSupportLink l = new PatientSupportLink();
        l.setPatient(patient);
        l.setMember(member);
        l.setTrustLevel("NORMAL");
        l.setPriorityRank(2);
        l.setPermissions(Set.of());
        l.setCanAccessHome(false);
        return l;
    }
}
