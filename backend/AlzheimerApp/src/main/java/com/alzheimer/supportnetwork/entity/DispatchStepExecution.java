package com.alzheimer.supportnetwork.entity;

import com.alzheimer.supportnetwork.domain.DispatchStepStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "dispatch_step_executions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchStepExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "dispatch_id", nullable = false)
    private Dispatch dispatch;

    @Column(nullable = false)
    private int stepNumber;

    @Column(nullable = false)
    private int timeoutMinutes;

    @Column(nullable = false)
    private Long assigneeMemberId;

    @Column(length = 256)
    private String assigneeName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private DispatchStepStatus status = DispatchStepStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime startedAt;
}
