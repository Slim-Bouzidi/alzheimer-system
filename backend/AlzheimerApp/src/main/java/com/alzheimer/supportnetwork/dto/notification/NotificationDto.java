package com.alzheimer.supportnetwork.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {
    private Long id;
    private Long memberId;
    private String message;
    private String type;
    private LocalDateTime createdAt;
    private boolean read;
}
