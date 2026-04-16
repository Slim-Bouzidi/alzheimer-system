package com.alzheimer.supportnetwork.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false, length = 64)
    private String type;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    /** Persisted as {@code is_read} — never map as {@code read} (reserved word in MariaDB/MySQL). */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean readFlag = false;
}
