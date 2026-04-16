package com.alzheimer.supportnetwork.dto;

import lombok.Data;

@Data
public class PatientCreateDto {
    private Long id;
    private String fullName;
    private String zone;
    private Double latitude;
    private Double longitude;
}
