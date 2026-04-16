package com.alzheimer.supportnetwork.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NetworkDashboardDto {

    private long totalMissions;
    private long pendingMissions;
    private long completedMissions;
    private long escalatedMissions;
    /** Average minutes from mission creation to acceptance (0 if none accepted). */
    private double averageResponseTime;
    private long escalationCount;
    @Builder.Default
    private List<TopIntervenantDto> topIntervenants = new ArrayList<>();
    @Builder.Default
    private Map<String, Long> missionsPerZone = new LinkedHashMap<>();
}
