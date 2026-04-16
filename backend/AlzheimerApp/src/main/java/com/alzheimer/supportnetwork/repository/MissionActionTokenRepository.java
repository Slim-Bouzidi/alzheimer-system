package com.alzheimer.supportnetwork.repository;

import com.alzheimer.supportnetwork.entity.MissionActionToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MissionActionTokenRepository extends JpaRepository<MissionActionToken, Long> {

    Optional<MissionActionToken> findByToken(String token);

    List<MissionActionToken> findByMissionIdAndMemberId(Long missionId, Long memberId);
}
