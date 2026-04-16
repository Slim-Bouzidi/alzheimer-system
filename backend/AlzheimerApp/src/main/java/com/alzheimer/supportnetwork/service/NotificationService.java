package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.dto.notification.NotificationDto;
import com.alzheimer.supportnetwork.entity.Notification;
import com.alzheimer.supportnetwork.exception.NotFoundException;
import com.alzheimer.supportnetwork.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public NotificationDto createNotification(Long memberId, String message, String type) {
        if (memberId == null || message == null || message.isBlank()) {
            return null;
        }
        Notification n = Notification.builder()
                .memberId(memberId)
                .message(message.trim())
                .type(type == null || type.isBlank() ? "INFO" : type.trim())
                .createdAt(LocalDateTime.now())
                .readFlag(false)
                .build();
        return toDto(notificationRepository.save(n));
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getMemberNotifications(Long memberId) {
        return notificationRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public NotificationDto markAsRead(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notification not found: " + id));
        n.setReadFlag(true);
        return toDto(notificationRepository.save(n));
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long memberId) {
        return notificationRepository.countByMemberIdAndReadFlagFalse(memberId);
    }

    private NotificationDto toDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .memberId(n.getMemberId())
                .message(n.getMessage())
                .type(n.getType())
                .createdAt(n.getCreatedAt())
                .read(n.isReadFlag())
                .build();
    }
}
