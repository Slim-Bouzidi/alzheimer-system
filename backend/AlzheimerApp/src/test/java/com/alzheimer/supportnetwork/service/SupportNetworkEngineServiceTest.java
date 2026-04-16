package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.dto.engine.BestIntervenantsRequestDto;
import com.alzheimer.supportnetwork.dto.engine.BestIntervenantsResponseDto;
import com.alzheimer.supportnetwork.dto.engine.RankedIntervenantDto;
import com.alzheimer.supportnetwork.entity.AvailabilitySlot;
import com.alzheimer.supportnetwork.entity.Patient;
import com.alzheimer.supportnetwork.entity.PatientSupportLink;
import com.alzheimer.supportnetwork.entity.SupportMember;
import com.alzheimer.supportnetwork.repository.AvailabilitySlotRepository;
import com.alzheimer.supportnetwork.repository.MemberSkillRepository;
import com.alzheimer.supportnetwork.repository.PatientRepository;
import com.alzheimer.supportnetwork.repository.PatientSupportLinkRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SupportNetworkEngineService — ranking order")
class SupportNetworkEngineServiceTest {

    @Mock private PatientRepository patientRepository;
    @Mock private PatientSupportLinkRepository linkRepository;
    @Mock private AvailabilitySlotRepository availabilitySlotRepository;
    @Mock private MemberSkillRepository memberSkillRepository;

    @InjectMocks private SupportNetworkEngineService engineService;

    /** Monday 2026-04-13 12:00 — ISO day-of-week = 1 */
    private static final LocalDateTime MONDAY_NOON = LocalDateTime.of(2026, 4, 13, 12, 0);

    @Test
    @DisplayName("GIVEN empty links WHEN rank THEN items empty")
    void emptyListReturnsEmpty() {
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient(1L)));
        when(linkRepository.findByPatient_Id(1L)).thenReturn(List.of());

        BestIntervenantsResponseDto res =
                engineService.rankBestIntervenants(
                        BestIntervenantsRequestDto.builder().patientId(1L).now(MONDAY_NOON).build());

        assertThat(res.getItems()).isEmpty();
    }

    @Test
    @DisplayName("GIVEN TRUSTED+available vs NORMAL+available WHEN rank THEN TRUSTED first")
    void trustedAvailableBeforeNormalAvailable() {
        SupportMember trusted = member(10L, "Trusted");
        SupportMember normal = member(11L, "Normal");
        Patient p = patient(1L);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(p));
        when(linkRepository.findByPatient_Id(1L))
                .thenReturn(
                        List.of(
                                link(p, trusted, "TRUSTED", 1),
                                link(p, normal, "NORMAL", 1)));
        when(availabilitySlotRepository.findByMember_IdIn(List.of(10L, 11L)))
                .thenReturn(
                        List.of(
                                slot(trusted, 1, LocalTime.of(8, 0), LocalTime.of(18, 0)),
                                slot(normal, 1, LocalTime.of(8, 0), LocalTime.of(18, 0))));
        when(memberSkillRepository.findByMember_IdIn(anyList())).thenReturn(List.of());

        BestIntervenantsResponseDto res =
                engineService.rankBestIntervenants(
                        BestIntervenantsRequestDto.builder().patientId(1L).now(MONDAY_NOON).build());

        assertThat(res.getItems()).hasSize(2);
        assertThat(res.getItems().get(0).getMemberId()).isEqualTo(10L);
        assertThat(res.getItems().get(0).getAvailableNow()).isTrue();
        assertThat(res.getItems().get(1).getMemberId()).isEqualTo(11L);
    }

    @Test
    @DisplayName("GIVEN same trust/priority WHEN one not available THEN available member ranks first")
    void notAvailableMemberPenalizedAndOrderedAfter() {
        SupportMember available = member(20L, "Avail");
        SupportMember away = member(21L, "Away");
        Patient p = patient(2L);
        when(patientRepository.findById(2L)).thenReturn(Optional.of(p));
        when(linkRepository.findByPatient_Id(2L))
                .thenReturn(
                        List.of(
                                link(p, available, "TRUSTED", 1),
                                link(p, away, "TRUSTED", 1)));
        when(availabilitySlotRepository.findByMember_IdIn(List.of(20L, 21L)))
                .thenReturn(List.of(slot(available, 1, LocalTime.of(8, 0), LocalTime.of(18, 0))));
        when(memberSkillRepository.findByMember_IdIn(anyList())).thenReturn(List.of());

        BestIntervenantsResponseDto res =
                engineService.rankBestIntervenants(
                        BestIntervenantsRequestDto.builder().patientId(2L).now(MONDAY_NOON).build());

        List<RankedIntervenantDto> items = res.getItems();
        assertThat(items).hasSize(2);
        assertThat(items.get(0).getMemberId()).isEqualTo(20L);
        assertThat(items.get(0).getAvailableNow()).isTrue();
        assertThat(items.get(1).getMemberId()).isEqualTo(21L);
        assertThat(items.get(1).getAvailableNow()).isFalse();
    }

    @Test
    @DisplayName("GIVEN same trust/availability WHEN lower priority rank THEN higher priority (rank 1) first")
    void higherPriorityRankWinsTieBreakOnScore() {
        SupportMember highPri = member(30L, "P1");
        SupportMember lowPri = member(31L, "P2");
        Patient p = patient(3L);
        when(patientRepository.findById(3L)).thenReturn(Optional.of(p));
        when(linkRepository.findByPatient_Id(3L))
                .thenReturn(
                        List.of(
                                link(p, highPri, "NORMAL", 1),
                                link(p, lowPri, "NORMAL", 3)));
        when(availabilitySlotRepository.findByMember_IdIn(List.of(30L, 31L)))
                .thenReturn(
                        List.of(
                                slot(highPri, 1, LocalTime.of(8, 0), LocalTime.of(18, 0)),
                                slot(lowPri, 1, LocalTime.of(8, 0), LocalTime.of(18, 0))));
        when(memberSkillRepository.findByMember_IdIn(anyList())).thenReturn(List.of());

        BestIntervenantsResponseDto res =
                engineService.rankBestIntervenants(
                        BestIntervenantsRequestDto.builder().patientId(3L).now(MONDAY_NOON).build());

        assertThat(res.getItems()).hasSize(2);
        assertThat(res.getItems().get(0).getMemberId()).isEqualTo(30L);
        assertThat(res.getItems().get(1).getMemberId()).isEqualTo(31L);
    }

    private static Patient patient(Long id) {
        Patient p = new Patient();
        p.setId(id);
        p.setFullName("Pat");
        p.setZone("Z1");
        return p;
    }

    private static SupportMember member(Long id, String name) {
        SupportMember m = new SupportMember();
        m.setId(id);
        m.setFullName(name);
        m.setType("FAMILY");
        m.setLocationZone("Z1");
        return m;
    }

    private static PatientSupportLink link(Patient patient, SupportMember member, String trust, int priorityRank) {
        PatientSupportLink l = new PatientSupportLink();
        l.setPatient(patient);
        l.setMember(member);
        l.setTrustLevel(trust);
        l.setPriorityRank(priorityRank);
        l.setPermissions(Set.of());
        l.setCanAccessHome(false);
        return l;
    }

    private static AvailabilitySlot slot(SupportMember member, int dayOfWeek, LocalTime start, LocalTime end) {
        AvailabilitySlot s = new AvailabilitySlot();
        s.setMember(member);
        s.setDayOfWeek(dayOfWeek);
        s.setStartTime(start);
        s.setEndTime(end);
        s.setActive(true);
        return s;
    }
}
