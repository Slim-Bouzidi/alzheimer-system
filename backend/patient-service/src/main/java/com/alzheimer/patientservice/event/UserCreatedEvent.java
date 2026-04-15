package com.alzheimer.patientservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserCreatedEvent implements Serializable {
    private Long userId;
    private String keycloakId;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
}
