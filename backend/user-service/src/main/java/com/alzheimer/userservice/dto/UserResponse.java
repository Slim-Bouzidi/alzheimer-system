package com.alzheimer.userservice.dto;

import com.alzheimer.userservice.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String keycloakId;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
}
