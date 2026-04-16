package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.domain.MissionEmailActionType;
import com.alzheimer.supportnetwork.entity.MissionActionToken;
import com.alzheimer.supportnetwork.repository.MissionActionTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

/**
 * Issues and persists opaque one-time tokens for mission actions from email links (accept / decline).
 */
@Service
public class MissionActionTokenService {

    private static final Logger log = LoggerFactory.getLogger(MissionActionTokenService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final MissionActionTokenRepository missionActionTokenRepository;
    private final int ttlMinutes;

    public MissionActionTokenService(
            MissionActionTokenRepository missionActionTokenRepository,
            @Value("${support.network.mission-email-action-token-ttl-minutes:${support.network.mission-email-accept-token-ttl-minutes:30}}")
                    int ttlMinutes) {
        this.missionActionTokenRepository = missionActionTokenRepository;
        this.ttlMinutes = Math.max(5, ttlMinutes);
    }

    @Transactional
    public MissionActionToken createAcceptToken(long missionId, long memberId) {
        return createToken(missionId, memberId, MissionEmailActionType.ACCEPT);
    }

    @Transactional
    public MissionActionToken createDeclineToken(long missionId, long memberId) {
        return createToken(missionId, memberId, MissionEmailActionType.DECLINE);
    }

    private MissionActionToken createToken(long missionId, long memberId, MissionEmailActionType actionType) {
        LocalDateTime now = LocalDateTime.now();
        String raw = newTokenValue();
        MissionActionToken row =
                MissionActionToken.builder()
                        .token(raw)
                        .missionId(missionId)
                        .memberId(memberId)
                        .actionType(actionType)
                        .expiresAt(now.plusMinutes(ttlMinutes))
                        .used(false)
                        .createdAt(now)
                        .build();
        MissionActionToken saved = missionActionTokenRepository.save(row);
        log.info(
                "[EMAIL TOKEN] generated missionId={} memberId={} actionType={} ttlMinutes={}",
                missionId,
                memberId,
                actionType,
                ttlMinutes);
        return saved;
    }

    /**
     * Marks every other unused token for the same mission/member as used so only one email action can succeed.
     */
    @Transactional
    public void invalidateOtherTokensForMissionMember(long missionId, long memberId, String consumedToken) {
        if (consumedToken == null || consumedToken.isBlank()) {
            return;
        }
        for (MissionActionToken t : missionActionTokenRepository.findByMissionIdAndMemberId(missionId, memberId)) {
            if (t.isUsed()) {
                continue;
            }
            if (consumedToken.equals(t.getToken())) {
                continue;
            }
            t.setUsed(true);
            missionActionTokenRepository.save(t);
        }
    }

    private static String newTokenValue() {
        byte[] buf = new byte[32];
        RANDOM.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }
}
