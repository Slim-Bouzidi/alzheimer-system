package com.alzheimer.supportnetwork.controller;

import com.alzheimer.supportnetwork.dto.notification.NotificationDto;
import com.alzheimer.supportnetwork.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:4200")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/{memberId}")
    public List<NotificationDto> list(@PathVariable Long memberId) {
        return notificationService.getMemberNotifications(memberId);
    }

    @GetMapping("/unread-count/{memberId}")
    public Map<String, Long> unreadCount(@PathVariable Long memberId) {
        return Map.of("memberId", memberId, "unreadCount", notificationService.unreadCount(memberId));
    }

    @PatchMapping("/{id}/read")
    public NotificationDto markRead(@PathVariable Long id) {
        return notificationService.markAsRead(id);
    }
}
