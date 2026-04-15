package com.alzheimer.cognitiveservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cognitive_activities")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CognitiveActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientId; // Keycloak User ID

    private String gameType; // e.g., "memory", "reflex"

    private Integer score;

    private Long durationMs;

    private LocalDateTime timestamp;
}
