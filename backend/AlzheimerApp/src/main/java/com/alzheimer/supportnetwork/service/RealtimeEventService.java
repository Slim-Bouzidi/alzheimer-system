package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.entity.Mission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class RealtimeEventService {
    private static final Logger log = LoggerFactory.getLogger(RealtimeEventService.class);

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeEventService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendMissionUpdate(Long memberId, Mission mission) {
        if (memberId == null || mission == null) {
            return;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "MISSION_UPDATE");
        payload.put("memberId", memberId);
        payload.put("missionId", mission.getId());
        payload.put("status", mission.getStatus() != null ? mission.getStatus().name() : null);
        payload.put("stepNumber", mission.getStepNumber());
        payload.put("timestamp", OffsetDateTime.now().toString());
        try {
            messagingTemplate.convertAndSend("/topic/missions/" + memberId, payload);
            log.info("[WS SEND] to memberId={} missionId={} status={}", memberId, mission.getId(), mission.getStatus());
        } catch (Exception ex) {
            log.warn(
                    "[WS SEND] mission update non-fatal failure memberId={} missionId={}: {}",
                    memberId,
                    mission.getId(),
                    ex.getMessage());
        }
    }

    public void sendDispatchUpdate(Long dispatchId, Object data) {
        if (dispatchId == null) {
            return;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "DISPATCH_UPDATE");
        payload.put("dispatchId", dispatchId);
        payload.put("data", data);
        payload.put("timestamp", OffsetDateTime.now().toString());
        try {
            messagingTemplate.convertAndSend("/topic/dispatch/" + dispatchId, payload);
            log.info("[WS SEND] to dispatchId={} updateSent=true", dispatchId);
        } catch (Exception ex) {
            log.warn("[WS SEND] dispatch update non-fatal failure dispatchId={}: {}", dispatchId, ex.getMessage());
        }
    }

    public void sendNotification(Long memberId, String message) {
        if (memberId == null || message == null || message.isBlank()) {
            return;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "NOTIFICATION");
        payload.put("memberId", memberId);
        payload.put("message", message);
        payload.put("timestamp", OffsetDateTime.now().toString());
        try {
            messagingTemplate.convertAndSend("/topic/notifications/" + memberId, payload);
            log.info("[WS SEND] to memberId={} notification={}", memberId, message);
        } catch (Exception ex) {
            log.warn("[WS SEND] notification non-fatal failure memberId={}: {}", memberId, ex.getMessage());
        }
    }
}
