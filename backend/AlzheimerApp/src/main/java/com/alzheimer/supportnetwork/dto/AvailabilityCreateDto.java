package com.alzheimer.supportnetwork.dto;

import lombok.Data;

@Data
public class AvailabilityCreateDto {
    private Long memberId;
    private int dayOfWeek;
    private String startTime; // "08:00"
    private String endTime;   // "12:00"
    private boolean active = true;
}
