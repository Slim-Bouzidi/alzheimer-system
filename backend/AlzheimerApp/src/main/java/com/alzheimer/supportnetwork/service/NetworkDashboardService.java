package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.domain.MissionStatus;
import com.alzheimer.supportnetwork.dto.dashboard.NetworkDashboardDto;
import com.alzheimer.supportnetwork.dto.dashboard.TopIntervenantDto;
import com.alzheimer.supportnetwork.entity.InterventionReport;
import com.alzheimer.supportnetwork.entity.Mission;
import com.alzheimer.supportnetwork.entity.SupportMember;
import com.alzheimer.supportnetwork.repository.InterventionReportRepository;
import com.alzheimer.supportnetwork.repository.MissionRepository;
import com.alzheimer.supportnetwork.repository.SupportMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NetworkDashboardService {

    private static final String ZONE_UNKNOWN = "Non renseigné";

    private final MissionRepository missionRepository;
    private final InterventionReportRepository interventionReportRepository;
    private final SupportMemberRepository supportMemberRepository;

    public NetworkDashboardService(
            MissionRepository missionRepository,
            InterventionReportRepository interventionReportRepository,
            SupportMemberRepository supportMemberRepository) {
        this.missionRepository = missionRepository;
        this.interventionReportRepository = interventionReportRepository;
        this.supportMemberRepository = supportMemberRepository;
    }

    @Transactional(readOnly = true)
    public NetworkDashboardDto buildDashboard() {
        long total = missionRepository.count();
        long pending = missionRepository.countByStatus(MissionStatus.PENDING);
        long completed = missionRepository.countByStatus(MissionStatus.COMPLETED);
        long escalations = missionRepository.countEscalatedBeyondFirstStep();

        double avgResponse = averageAcceptanceDelayMinutes();

        List<InterventionReport> reports = interventionReportRepository.findAll();
        Map<Long, Double> avgRatingByMember = averageRatingByMember(reports);

        List<Mission> allMissions = missionRepository.findAll();
        Map<Long, Long> completedCountByMember = allMissions.stream()
                .filter(m -> m.getStatus() == MissionStatus.COMPLETED)
                .collect(Collectors.groupingBy(Mission::getAssignedMemberId, Collectors.counting()));

        Set<Long> memberIds = new HashSet<>();
        memberIds.addAll(avgRatingByMember.keySet());
        memberIds.addAll(completedCountByMember.keySet());

        Map<Long, SupportMember> membersById = supportMemberRepository.findAllById(memberIds).stream()
                .collect(Collectors.toMap(SupportMember::getId, m -> m, (a, b) -> a));

        List<TopIntervenantDto> top = memberIds.stream()
                .map(id -> {
                    double rating = avgRatingByMember.getOrDefault(id, 0.0);
                    long done = completedCountByMember.getOrDefault(id, 0L);
                    SupportMember sm = membersById.get(id);
                    String name = sm != null && sm.getFullName() != null && !sm.getFullName().isBlank()
                            ? sm.getFullName()
                            : ("Member #" + id);
                    return new ScoreRow(id, name, rating, done);
                })
                .sorted(Comparator.comparingDouble(ScoreRow::avgRating).reversed()
                        .thenComparingLong(ScoreRow::completedCount).reversed())
                .limit(5)
                .map(r -> TopIntervenantDto.builder()
                        .memberId(r.memberId)
                        .name(r.name)
                        .rating(round1(r.avgRating))
                        .build())
                .toList();

        Map<String, Long> perZone = missionsPerZone(allMissions, supportMemberRepository.findAll());

        return NetworkDashboardDto.builder()
                .totalMissions(total)
                .pendingMissions(pending)
                .completedMissions(completed)
                .escalatedMissions(escalations)
                .averageResponseTime(round1(avgResponse))
                .escalationCount(escalations)
                .topIntervenants(top)
                .missionsPerZone(perZone)
                .build();
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private double averageAcceptanceDelayMinutes() {
        return missionRepository.findAll().stream()
                .filter(m -> m.getAcceptedAt() != null && m.getCreatedAt() != null)
                .mapToLong(m -> ChronoUnit.MINUTES.between(m.getCreatedAt(), m.getAcceptedAt()))
                .average()
                .orElse(0.0);
    }

    private static Map<Long, Double> averageRatingByMember(List<InterventionReport> reports) {
        return reports.stream()
                .collect(Collectors.groupingBy(
                        InterventionReport::getMemberId,
                        Collectors.averagingInt(InterventionReport::getRating)));
    }

    private static Map<String, Long> missionsPerZone(List<Mission> missions, List<SupportMember> allMembers) {
        Map<Long, String> zoneByMemberId = allMembers.stream()
                .filter(m -> m.getId() != null)
                .collect(Collectors.toMap(
                        SupportMember::getId,
                        m -> (m.getLocationZone() == null || m.getLocationZone().isBlank())
                                ? ZONE_UNKNOWN
                                : m.getLocationZone().trim(),
                        (a, b) -> a));

        Map<String, Long> counts = new HashMap<>();
        for (Mission mission : missions) {
            Long mid = mission.getAssignedMemberId();
            String zone = mid == null ? ZONE_UNKNOWN : zoneByMemberId.getOrDefault(mid, ZONE_UNKNOWN);
            counts.merge(zone, 1L, Long::sum);
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByKey(String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new));
    }

    private record ScoreRow(Long memberId, String name, double avgRating, long completedCount) {}
}
