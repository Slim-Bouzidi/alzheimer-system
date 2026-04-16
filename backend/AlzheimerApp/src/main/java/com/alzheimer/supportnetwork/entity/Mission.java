package com.alzheimer.supportnetwork.entity;

import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.domain.MissionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "missions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long assignedMemberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AlertType alertType;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private MissionStatus status;

    /** Current escalation step (1-based), aligned with dispatch plan steps. */
    @Column(nullable = false, columnDefinition = "INT NOT NULL DEFAULT 1")
    @Builder.Default
    private int stepNumber = 1;

    /** When the current escalation step started (timeout measured from this). */
    private LocalDateTime lastAssignedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime acceptedAt;

    private LocalDateTime completedAt;
}
