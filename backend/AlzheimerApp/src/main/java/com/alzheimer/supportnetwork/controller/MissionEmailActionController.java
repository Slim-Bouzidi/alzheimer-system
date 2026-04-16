package com.alzheimer.supportnetwork.controller;

import com.alzheimer.supportnetwork.service.MissionEmailActionService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public GET endpoints for one-click mission actions from transactional email links (opaque token only).
 */
@RestController
@RequestMapping("/api/missions/email-action")
@CrossOrigin(origins = "*")
public class MissionEmailActionController {

    private static final String HTML_ACCEPT_OK =
            "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Support Network</title></head>"
                    + "<body><p>Mission accepted successfully.</p></body></html>";

    private static final String HTML_DECLINE_OK =
            "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Support Network</title></head>"
                    + "<body><p>Mission declined. Next responder has been notified.</p></body></html>";

    private static final String HTML_ERR =
            "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Support Network</title></head>"
                    + "<body><p>This mission link is invalid or expired.</p></body></html>";

    private final MissionEmailActionService missionEmailActionService;

    public MissionEmailActionController(MissionEmailActionService missionEmailActionService) {
        this.missionEmailActionService = missionEmailActionService;
    }

    @GetMapping(value = "/accept", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> acceptFromEmail(@RequestParam(value = "token", required = false) String token) {
        MissionEmailActionService.Outcome outcome = missionEmailActionService.acceptMissionFromEmailToken(token);
        if (outcome == MissionEmailActionService.Outcome.OK) {
            return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(HTML_ACCEPT_OK);
        }
        return ResponseEntity.status(400).contentType(MediaType.TEXT_HTML).body(HTML_ERR);
    }

    @GetMapping(value = "/decline", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> declineFromEmail(@RequestParam(value = "token", required = false) String token) {
        MissionEmailActionService.Outcome outcome = missionEmailActionService.declineMissionFromEmailToken(token);
        if (outcome == MissionEmailActionService.Outcome.OK) {
            return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(HTML_DECLINE_OK);
        }
        return ResponseEntity.status(400).contentType(MediaType.TEXT_HTML).body(HTML_ERR);
    }
}
