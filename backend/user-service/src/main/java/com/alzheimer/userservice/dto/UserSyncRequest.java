package com.alzheimer.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSyncRequest {
    
    @NotBlank(message = "Keycloak ID is required")
    private String keycloakId;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    
    @NotBlank(message = "Role is required")
    @Pattern(regexp = "ADMIN|DOCTOR|CAREGIVER|PATIENT", message = "Role must be one of: ADMIN, DOCTOR, CAREGIVER, PATIENT")
    private String role;
}
