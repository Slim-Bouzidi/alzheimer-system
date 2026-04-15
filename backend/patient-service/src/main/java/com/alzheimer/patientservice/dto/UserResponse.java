package com.alzheimer.patientservice.dto;

import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String keycloakId;
    private String email;
    private String role;
}
