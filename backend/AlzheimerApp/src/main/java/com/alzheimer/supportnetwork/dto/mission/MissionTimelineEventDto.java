package com.alzheimer.supportnetwork.dto.mission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MissionTimelineEventDto {
    private String type;
    private LocalDateTime timestamp;
    private String memberName;
    private String description;
}
