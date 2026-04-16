package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.domain.MissionEmailActionType;
import com.alzheimer.supportnetwork.domain.MissionStatus;
import com.alzheimer.supportnetwork.entity.Mission;
import com.alzheimer.supportnetwork.entity.MissionActionToken;
import com.alzheimer.supportnetwork.repository.MissionActionTokenRepository;
import com.alzheimer.supportnetwork.repository.MissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

/**
 * Validates opaque email tokens and applies {@link MissionService#acceptMission(Long)} or
 * {@link MissionService#declineMission(Long)} when allowed.
 */
@Service
public class MissionEmailActionService {

    private static final Logger log = LoggerFactory.getLogger(MissionEmailActionService.class);

    public enum Outcome {
        OK,
        MISSING_TOKEN,
        UNKNOWN_TOKEN,
        EXPIRED,
        ALREADY_USED,
        WRONG_ACTION_TYPE,
        MISSION_NOT_FOUND,
        WRONG_ASSIGNEE,
        NOT_PENDING
    }

    private final MissionActionTokenRepository missionActionTokenRepository;
    private final MissionRepository missionRepository;
    private final MissionService missionService;
    private final MissionActionTokenService missionActionTokenService;

    public MissionEmailActionService(
            MissionActionTokenRepository missionActionTokenRepository,
            MissionRepository missionRepository,
            MissionService missionService,
            MissionActionTokenService missionActionTokenService) {
        this.missionActionTokenRepository = missionActionTokenRepository;
        this.missionRepository = missionRepository;
        this.missionService = missionService;
        this.missionActionTokenService = missionActionTokenService;
    }

    @Transactional
    public Outcome acceptMissionFromEmailToken(String rawToken) {
        return process(rawToken, MissionEmailActionType.ACCEPT);
    }

    @Transactional
    public Outcome declineMissionFromEmailToken(String rawToken) {
        return process(rawToken, MissionEmailActionType.DECLINE);
    }

    private Outcome process(String rawToken, MissionEmailActionType expectedType) {
        if (!StringUtils.hasText(rawToken)) {
            log.info("[EmailAction] Missing token parameter actionType={}", expectedType);
            return Outcome.MISSING_TOKEN;
        }
        String token = rawToken.trim();
        MissionActionToken row = missionActionTokenRepository.findByToken(token).orElse(null);
        if (row == null) {
            log.info("[EmailAction] Unknown token actionType={}", expectedType);
            return Outcome.UNKNOWN_TOKEN;
        }
        if (row.isUsed()) {
            log.info(
                    "[EmailAction] Already used token missionId={} memberId={} actionType={}",
                    row.getMissionId(),
                    row.getMemberId(),
                    row.getActionType());
            return Outcome.ALREADY_USED;
        }
        if (row.getExpiresAt() != null && row.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.info(
                    "[EmailAction] Expired token missionId={} memberId={} actionType={}",
                    row.getMissionId(),
                    row.getMemberId(),
                    row.getActionType());
            return Outcome.EXPIRED;
        }
        if (row.getActionType() != expectedType) {
            log.info(
                    "[EmailAction] Wrong action type for link expected={} actual={} missionId={}",
                    expectedType,
                    row.getActionType(),
                    row.getMissionId());
            return Outcome.WRONG_ACTION_TYPE;
        }
        Mission mission = missionRepository.findById(row.getMissionId()).orElse(null);
        if (mission == null) {
            return Outcome.MISSION_NOT_FOUND;
        }
        if (!mission.getAssignedMemberId().equals(row.getMemberId())) {
            log.info(
                    "[EmailAction] Token assignee mismatch missionId={} tokenMemberId={} missionAssigneeId={}",
                    mission.getId(),
                    row.getMemberId(),
                    mission.getAssignedMemberId());
            return Outcome.WRONG_ASSIGNEE;
        }
        if (mission.getStatus() != MissionStatus.PENDING) {
            log.info(
                    "[EmailAction] Mission not PENDING missionId={} status={} actionType={}",
                    mission.getId(),
                    mission.getStatus(),
                    expectedType);
            return Outcome.NOT_PENDING;
        }

        if (expectedType == MissionEmailActionType.ACCEPT) {
            missionService.acceptMission(mission.getId());
            log.info("[EmailAction] Mission accepted from email missionId={} memberId={}", mission.getId(), row.getMemberId());
        } else {
            log.info("[EMAIL DECLINE] missionId={} memberId={}", mission.getId(), row.getMemberId());
            missionService.declineMission(mission.getId());
            log.info("[EmailAction] Mission declined from email missionId={} memberId={}", mission.getId(), row.getMemberId());
        }

        missionActionTokenService.invalidateOtherTokensForMissionMember(
                row.getMissionId(), row.getMemberId(), token);
        row.setUsed(true);
        missionActionTokenRepository.save(row);
        return Outcome.OK;
    }
}
