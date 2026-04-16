package com.alzheimer.supportnetwork.dto;

import lombok.Data;

import java.util.Set;

@Data
public class LinkCreateDto {
    private Long patientId;
    private Long memberId;

    private String roleInNetwork;
    private String trustLevel;
    private int priorityRank;
    private Set<String> permissions;
    private boolean canAccessHome;
}
