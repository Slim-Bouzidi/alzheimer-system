package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.domain.MissionEmailActionType;
import com.alzheimer.supportnetwork.domain.MissionStatus;
import com.alzheimer.supportnetwork.entity.Mission;
import com.alzheimer.supportnetwork.entity.MissionActionToken;
import com.alzheimer.supportnetwork.repository.MissionActionTokenRepository;
import com.alzheimer.supportnetwork.repository.MissionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("MissionEmailActionService")
class MissionEmailActionServiceTest {

    @Mock private MissionActionTokenRepository missionActionTokenRepository;
    @Mock private MissionRepository missionRepository;
    @Mock private MissionService missionService;
    @Mock private MissionActionTokenService missionActionTokenService;

    @InjectMocks private MissionEmailActionService missionEmailActionService;

    private static MissionActionToken tokenRow(
            String token,
            long missionId,
            long memberId,
            boolean used,
            LocalDateTime expiresAt,
            MissionEmailActionType actionType) {
        return MissionActionToken.builder()
                .id(1L)
                .token(token)
                .missionId(missionId)
                .memberId(memberId)
                .actionType(actionType)
                .expiresAt(expiresAt)
                .used(used)
                .createdAt(LocalDateTime.of(2026, 4, 14, 10, 0))
                .build();
    }

    private static Mission mission(long id, long assignedMemberId, MissionStatus status) {
        return Mission.builder()
                .id(id)
                .patientId(10L)
                .assignedMemberId(assignedMemberId)
                .alertType(com.alzheimer.supportnetwork.domain.AlertType.MALAISE)
                .title("t")
                .status(status)
                .stepNumber(1)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("valid ACCEPT token accepts mission, invalidates siblings, marks token used")
    void validAcceptToken() {
        LocalDateTime future = LocalDateTime.now().plusHours(1);
        MissionActionToken row = tokenRow("abc", 7L, 3L, false, future, MissionEmailActionType.ACCEPT);
        when(missionActionTokenRepository.findByToken("abc")).thenReturn(Optional.of(row));
        when(missionRepository.findById(7L)).thenReturn(Optional.of(mission(7L, 3L, MissionStatus.PENDING)));

        assertThat(missionEmailActionService.acceptMissionFromEmailToken("abc"))
                .isEqualTo(MissionEmailActionService.Outcome.OK);

        verify(missionService).acceptMission(7L);
        verify(missionActionTokenService).invalidateOtherTokensForMissionMember(7L, 3L, "abc");
        ArgumentCaptor<MissionActionToken> captor = ArgumentCaptor.forClass(MissionActionToken.class);
        verify(missionActionTokenRepository).save(captor.capture());
        assertThat(captor.getValue().isUsed()).isTrue();
    }

    @Test
    @DisplayName("valid DECLINE token declines mission")
    void validDeclineToken() {
        LocalDateTime future = LocalDateTime.now().plusHours(1);
        MissionActionToken row = tokenRow("dec", 7L, 3L, false, future, MissionEmailActionType.DECLINE);
        when(missionActionTokenRepository.findByToken("dec")).thenReturn(Optional.of(row));
        when(missionRepository.findById(7L)).thenReturn(Optional.of(mission(7L, 3L, MissionStatus.PENDING)));

        assertThat(missionEmailActionService.declineMissionFromEmailToken("dec"))
                .isEqualTo(MissionEmailActionService.Outcome.OK);

        verify(missionService).declineMission(7L);
        verify(missionActionTokenService).invalidateOtherTokensForMissionMember(7L, 3L, "dec");
    }

    @Test
    @DisplayName("DECLINE token used on accept endpoint yields WRONG_ACTION_TYPE")
    void wrongActionTypeOnAccept() {
        LocalDateTime future = LocalDateTime.now().plusHours(1);
        MissionActionToken row = tokenRow("x", 7L, 3L, false, future, MissionEmailActionType.DECLINE);
        when(missionActionTokenRepository.findByToken("x")).thenReturn(Optional.of(row));

        assertThat(missionEmailActionService.acceptMissionFromEmailToken("x"))
                .isEqualTo(MissionEmailActionService.Outcome.WRONG_ACTION_TYPE);
        verify(missionService, never()).acceptMission(any());
    }

    @Test
    @DisplayName("ACCEPT token used on decline endpoint yields WRONG_ACTION_TYPE")
    void wrongActionTypeOnDecline() {
        LocalDateTime future = LocalDateTime.now().plusHours(1);
        MissionActionToken row = tokenRow("y", 7L, 3L, false, future, MissionEmailActionType.ACCEPT);
        when(missionActionTokenRepository.findByToken("y")).thenReturn(Optional.of(row));

        assertThat(missionEmailActionService.declineMissionFromEmailToken("y"))
                .isEqualTo(MissionEmailActionService.Outcome.WRONG_ACTION_TYPE);
        verify(missionService, never()).declineMission(any());
    }

    @Test
    @DisplayName("expired token rejected")
    void expiredTokenRejected() {
        MissionActionToken row =
                tokenRow("exp", 7L, 3L, false, LocalDateTime.now().minusHours(1), MissionEmailActionType.ACCEPT);
        when(missionActionTokenRepository.findByToken("exp")).thenReturn(Optional.of(row));

        assertThat(missionEmailActionService.acceptMissionFromEmailToken("exp"))
                .isEqualTo(MissionEmailActionService.Outcome.EXPIRED);
        verify(missionService, never()).acceptMission(any());
    }

    @Test
    @DisplayName("already used token rejected")
    void usedTokenRejected() {
        MissionActionToken row =
                tokenRow("used", 7L, 3L, true, LocalDateTime.now().plusHours(1), MissionEmailActionType.ACCEPT);
        when(missionActionTokenRepository.findByToken("used")).thenReturn(Optional.of(row));

        assertThat(missionEmailActionService.acceptMissionFromEmailToken("used"))
                .isEqualTo(MissionEmailActionService.Outcome.ALREADY_USED);
    }

    @Test
    @DisplayName("wrong member rejected")
    void wrongMemberRejected() {
        LocalDateTime future = LocalDateTime.now().plusHours(1);
        MissionActionToken row = tokenRow("wm", 7L, 3L, false, future, MissionEmailActionType.ACCEPT);
        when(missionActionTokenRepository.findByToken("wm")).thenReturn(Optional.of(row));
        when(missionRepository.findById(7L)).thenReturn(Optional.of(mission(7L, 99L, MissionStatus.PENDING)));

        assertThat(missionEmailActionService.acceptMissionFromEmailToken("wm"))
                .isEqualTo(MissionEmailActionService.Outcome.WRONG_ASSIGNEE);
    }

    @Test
    @DisplayName("non-PENDING mission rejected")
    void notPendingRejected() {
        LocalDateTime future = LocalDateTime.now().plusHours(1);
        MissionActionToken row = tokenRow("np", 7L, 3L, false, future, MissionEmailActionType.DECLINE);
        when(missionActionTokenRepository.findByToken("np")).thenReturn(Optional.of(row));
        when(missionRepository.findById(7L)).thenReturn(Optional.of(mission(7L, 3L, MissionStatus.ACCEPTED)));

        assertThat(missionEmailActionService.declineMissionFromEmailToken("np"))
                .isEqualTo(MissionEmailActionService.Outcome.NOT_PENDING);
        verify(missionService, never()).declineMission(any());
    }
}
