package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.dto.mail.EmailSendOutcome;
import com.alzheimer.supportnetwork.dto.mail.EmailSendStatus;
import com.alzheimer.supportnetwork.entity.Mission;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Sends transactional emails via Brevo HTTP API (no SMTP).
 * Returns {@link EmailSendOutcome} so callers never rely on misleading log lines alone.
 */
@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    /** Practical RFC 5322–oriented check; Brevo still validates server-side. */
    private static final Pattern EMAIL =
            Pattern.compile("^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}$");

    private static final Set<String> FREEMAIL_DOMAINS =
            Set.of(
                    "gmail.com",
                    "googlemail.com",
                    "yahoo.com",
                    "yahoo.fr",
                    "hotmail.com",
                    "hotmail.fr",
                    "outlook.com",
                    "live.com",
                    "icloud.com",
                    "me.com",
                    "msn.com",
                    "aol.com",
                    "gmx.com",
                    "gmx.fr",
                    "protonmail.com",
                    "proton.me");

    private final RestTemplate brevoRestTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;
    private final String apiUrl;
    private final String senderEmail;
    private final String senderName;
    private final boolean replyToEnabled;
    private final String replyToEmailOverride;
    private final String replyToNameOverride;
    private final boolean sendMissionAssignedEnabled;
    private final boolean sendAlertTriggeredEnabled;
    private final boolean sendEscalationEnabled;
    private final String missionEmailAcceptBaseUrl;
    /**
     * Brevo issues SMTP relay credentials (prefix {@code xsmtpsib-}) for the SMTP protocol only.
     * The transactional HTTP API ({@code /v3/smtp/email}) requires a v3 API key (typically {@code xkeysib-...})
     * from Brevo (SMTP and API, API Keys) — not the SMTP relay password alone.
     */
    private final boolean smtpKeyUsedWhereRestApiRequired;

    public EmailNotificationService(
            @Qualifier("brevoRestTemplate") RestTemplate brevoRestTemplate,
            @Value("${brevo.api.key:}") String apiKey,
            @Value("${brevo.api.url:https://api.brevo.com/v3/smtp/email}") String apiUrl,
            @Value("${brevo.sender.email:}") String senderEmail,
            @Value("${brevo.sender.name:Support Network}") String senderName,
            @Value("${brevo.http.connect-timeout-ms:5000}") int connectTimeoutMsForLog,
            @Value("${brevo.http.read-timeout-ms:10000}") int readTimeoutMsForLog,
            @Value("${brevo.reply-to.enabled:true}") boolean replyToEnabled,
            @Value("${brevo.reply-to.email:}") String replyToEmailOverride,
            @Value("${brevo.reply-to.name:}") String replyToNameOverride,
            @Value("${support.network.mail.send-on-mission-assigned:true}") boolean sendMissionAssignedEnabled,
            @Value("${support.network.mail.send-on-alert-triggered:true}") boolean sendAlertTriggeredEnabled,
            @Value("${support.network.mail.send-on-final-escalation:true}") boolean sendEscalationEnabled,
            @Value("${support.network.mission-email-accept-base-url:http://localhost:8082}")
                    String missionEmailAcceptBaseUrl) {
        this.brevoRestTemplate = brevoRestTemplate;
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.apiUrl = apiUrl;
        this.senderEmail = senderEmail != null ? senderEmail.trim() : "";
        this.senderName = senderName != null ? senderName.trim() : "Support Network";
        this.replyToEnabled = replyToEnabled;
        this.replyToEmailOverride =
                replyToEmailOverride != null && StringUtils.hasText(replyToEmailOverride.trim())
                        ? replyToEmailOverride.trim()
                        : "";
        this.replyToNameOverride =
                replyToNameOverride != null && StringUtils.hasText(replyToNameOverride.trim())
                        ? replyToNameOverride.trim()
                        : "";
        this.sendMissionAssignedEnabled = sendMissionAssignedEnabled;
        this.sendAlertTriggeredEnabled = sendAlertTriggeredEnabled;
        this.sendEscalationEnabled = sendEscalationEnabled;
        this.missionEmailAcceptBaseUrl = normalizeAcceptBaseUrl(missionEmailAcceptBaseUrl);

        this.smtpKeyUsedWhereRestApiRequired =
                StringUtils.hasText(this.apiKey) && this.apiKey.regionMatches(true, 0, "xsmtpsib-", 0, "xsmtpsib-".length());
        if (this.smtpKeyUsedWhereRestApiRequired) {
            log.error(
                    "[BREVO CONFIG] La clé commence par xsmtpsib- : c'est une clé **SMTP relais**, pas une clé API v3. "
                            + "L'application appelle l'API HTTP POST /v3/smtp/email : créez une clé dans Brevo > "
                            + "SMTP et API > API Keys (clé transactionnelle, préfixe habituel xkeysib-). "
                            + "Les clés de l'onglet SMTP uniquement ne fonctionnent pas ici.");
        }

        boolean mockByConfig =
                this.smtpKeyUsedWhereRestApiRequired
                        || !StringUtils.hasText(this.apiKey)
                        || !StringUtils.hasText(this.senderEmail)
                        || !isValidEmail(this.senderEmail);
        log.info(
                "[BREVO CONFIG] effectiveMockMode(noHttpCalls)={} apiKeyPresent={} apiKeyLength={} senderEmail={} "
                        + "apiUrl={} connectTimeoutMs={} readTimeoutMs={} replyToEnabled={} sendMissionAssigned={} "
                        + "sendAlertTriggered={} sendFinalEscalation={}",
                mockByConfig,
                StringUtils.hasText(this.apiKey),
                this.apiKey.length(),
                this.senderEmail,
                this.apiUrl,
                Math.max(connectTimeoutMsForLog, 1000),
                Math.max(readTimeoutMsForLog, 1000),
                this.replyToEnabled,
                this.sendMissionAssignedEnabled,
                this.sendAlertTriggeredEnabled,
                this.sendEscalationEnabled);
        if (this.smtpKeyUsedWhereRestApiRequired) {
            log.info("[BREVO CONFIG] smtpRelayKeyDetected=true (HTTP sends désactivés tant que la clé API v3 n'est pas configurée)");
        }
        if (StringUtils.hasText(this.senderEmail) && isFreemailDomain(this.senderEmail)) {
            log.warn(
                    "[BREVO CONFIG] Sender uses a freemail domain ({}). Verify the sender in Brevo; "
                            + "corporate inboxes may block or delay. Use an authenticated domain for production.",
                    domainOf(this.senderEmail));
        }
        if (StringUtils.hasText(this.senderEmail) && !isValidEmail(this.senderEmail)) {
            log.warn("[BREVO CONFIG] brevo.sender.email is not a valid address format; API sends will be skipped.");
        }
        if (!StringUtils.hasText(this.apiKey)) {
            log.warn(
                    "[BREVO CONFIG] No API key resolved for brevo.api.key. Set environment variable BREVO_API_KEY "
                            + "and/or SENDINBLUE_API_KEY, or brevo.api.key in application-local.properties (not committed).");
        }
    }

    public EmailSendOutcome sendMissionAssignedEmail(String to, Mission mission) {
        return sendMissionAssignedEmail(to, mission, null, null);
    }

    public EmailSendOutcome sendMissionAssignedEmail(String to, Mission mission, String acceptToken) {
        return sendMissionAssignedEmail(to, mission, acceptToken, null);
    }

    public EmailSendOutcome sendMissionAssignedEmail(String to, Mission mission, String acceptToken, String declineToken) {
        if (!sendMissionAssignedEnabled) {
            log.info(
                    "[BREVO SKIP] sendMissionAssignedEmail reason=TOGGLE_OFF support.network.mail.send-on-mission-assigned=false "
                            + "missionId={} intendedRecipient={}",
                    mission != null ? mission.getId() : null,
                    maskEmail(normalizeEmailAddress(to)));
            return EmailSendOutcome.skipped(
                    EmailSendStatus.SKIPPED_DISABLED, "send-on-mission-assigned=false");
        }
        if (mission == null) {
            log.warn("[BREVO SKIP] sendMissionAssignedEmail reason=NULL_MISSION");
            return EmailSendOutcome.skipped(EmailSendStatus.SKIPPED_NULL_MISSION, "mission is null");
        }

        String subject = "[Support Network] New mission assigned #" + mission.getId();
        String acceptLink = buildMissionActionLink("accept", acceptToken);
        String declineLink = buildMissionActionLink("decline", declineToken);
        String textBody = buildMissionAssignedBody(mission, acceptLink, declineLink);
        String htmlBody = buildMissionAssignedHtml(mission, acceptLink, declineLink);
        String normalized = normalizeEmailAddress(to);

        log.info(
                "[BREVO FLOW] sendMissionAssignedEmail missionId={} memberId={} intendedRecipient={} subject=\"{}\" "
                        + "hasHtml={}",
                mission.getId(),
                mission.getAssignedMemberId(),
                maskEmail(normalized),
                subject,
                StringUtils.hasText(htmlBody));

        if (!StringUtils.hasText(normalized)) {
            logIntentionalMockPreview(
                    "(none)",
                    subject,
                    textBody,
                    "No recipient address (memberId=" + mission.getAssignedMemberId() + ")");
            return EmailSendOutcome.skipped(
                    EmailSendStatus.SKIPPED_NO_RECIPIENT, "blank recipient after normalize");
        }
        if (!isValidEmail(normalized)) {
            log.warn(
                    "[BREVO SKIP] sendMissionAssignedEmail reason=INVALID_RECIPIENT_FORMAT missionId={} raw={}",
                    mission.getId(),
                    maskEmail(normalized));
            return EmailSendOutcome.skipped(
                    EmailSendStatus.SKIPPED_INVALID_RECIPIENT, "invalid recipient format: " + maskEmail(normalized));
        }

        return sendOrBrevo(normalized, subject, textBody, htmlBody, "mission-assigned");
    }

    public EmailSendOutcome sendEscalationEmail(String to, String message) {
        if (!sendEscalationEnabled) {
            log.info(
                    "[BREVO SKIP] sendEscalationEmail reason=TOGGLE_OFF support.network.mail.send-on-final-escalation=false "
                            + "intendedRecipient={}",
                    maskEmail(normalizeEmailAddress(to)));
            return EmailSendOutcome.skipped(
                    EmailSendStatus.SKIPPED_DISABLED, "send-on-final-escalation=false");
        }
        String subject = "[Support Network] Final escalation";
        String body = buildEscalationBody(message);
        String normalized = normalizeEmailAddress(to);
        log.info("[BREVO FLOW] sendEscalationEmail intendedRecipient={} subject=\"{}\"", maskEmail(normalized), subject);
        if (!StringUtils.hasText(normalized)) {
            logIntentionalMockPreview(
                    "(none)", subject, body, "No admin recipient (set support.network.mail.admin-email)");
            return EmailSendOutcome.skipped(
                    EmailSendStatus.SKIPPED_NO_RECIPIENT, "blank admin-email after normalize");
        }
        if (!isValidEmail(normalized)) {
            log.warn("[BREVO SKIP] sendEscalationEmail reason=INVALID_RECIPIENT_FORMAT raw={}", maskEmail(normalized));
            return EmailSendOutcome.skipped(
                    EmailSendStatus.SKIPPED_INVALID_RECIPIENT, "invalid recipient: " + maskEmail(normalized));
        }
        return sendOrBrevo(normalized, subject, body, null, "final-escalation");
    }

    public EmailSendOutcome sendAlertTriggeredEmail(String to, Long patientId, String alertType) {
        if (!sendAlertTriggeredEnabled) {
            log.info(
                    "[BREVO SKIP] sendAlertTriggeredEmail reason=TOGGLE_OFF support.network.mail.send-on-alert-triggered=false "
                            + "patientId={} intendedRecipient={}",
                    patientId,
                    maskEmail(normalizeEmailAddress(to)));
            return EmailSendOutcome.skipped(
                    EmailSendStatus.SKIPPED_DISABLED, "send-on-alert-triggered=false");
        }
        String subject = "[Support Network] Alert triggered — patient " + patientId;
        String body =
                "An alert was triggered and processed by the support network service.\n"
                        + "Patient ID: "
                        + patientId
                        + "\n"
                        + "Alert type: "
                        + (alertType != null ? alertType : "(unknown)")
                        + "\n"
                        + "A mission has been created for the first-step assignee (see mission notification).";
        String normalized = normalizeEmailAddress(to);
        log.info(
                "[BREVO FLOW] sendAlertTriggeredEmail patientId={} intendedRecipient={} subject=\"{}\"",
                patientId,
                maskEmail(normalized),
                subject);
        if (!StringUtils.hasText(normalized)) {
            logIntentionalMockPreview(
                    "(none)", subject, body, "No admin recipient (set support.network.mail.admin-email)");
            return EmailSendOutcome.skipped(
                    EmailSendStatus.SKIPPED_NO_RECIPIENT, "blank admin-email after normalize");
        }
        if (!isValidEmail(normalized)) {
            log.warn("[BREVO SKIP] sendAlertTriggeredEmail reason=INVALID_RECIPIENT_FORMAT raw={}", maskEmail(normalized));
            return EmailSendOutcome.skipped(
                    EmailSendStatus.SKIPPED_INVALID_RECIPIENT, "invalid recipient: " + maskEmail(normalized));
        }
        return sendOrBrevo(normalized, subject, body, null, "alert-triggered");
    }

    private EmailSendOutcome sendOrBrevo(String to, String subject, String textBody, String htmlBody, String emailKind) {
        boolean mockMode =
                smtpKeyUsedWhereRestApiRequired
                        || !StringUtils.hasText(apiKey)
                        || !StringUtils.hasText(senderEmail)
                        || !isValidEmail(senderEmail);

        log.info(
                "[BREVO SEND] kind={} httpCallPlanned={} brevoSender={} intendedRecipient={} subject=\"{}\"",
                emailKind,
                !mockMode,
                maskEmail(senderEmail),
                maskEmail(to),
                subject);

        if (mockMode) {
            String reason;
            if (smtpKeyUsedWhereRestApiRequired) {
                reason =
                        "Clé SMTP (xsmtpsib-) : utiliser une clé API v3 Brevo (xkeysib-…) pour l'API REST /v3/smtp/email — "
                                + "Brevo → SMTP & API → API Keys";
            } else if (!StringUtils.hasText(apiKey)) {
                reason = "Missing brevo.api.key (set BREVO_API_KEY / SENDINBLUE_API_KEY or property brevo.api.key)";
            } else if (!StringUtils.hasText(senderEmail)) {
                reason = "Missing brevo.sender.email";
            } else {
                reason = "Invalid brevo.sender.email format";
            }
            log.warn("[BREVO MOCK] kind={} reason={} — no HTTP call to Brevo", emailKind, reason);
            logIntentionalMockPreview(to, subject, textBody != null ? textBody : "", reason);
            return EmailSendOutcome.mockMode(reason);
        }

        if (senderEmail.equalsIgnoreCase(to)) {
            log.warn(
                    "[BREVO] intendedRecipient equals brevo.sender.email ({}). Mail may land in the same mailbox as the sender.",
                    maskEmail(senderEmail));
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("api-key", apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sender", Map.of("email", senderEmail, "name", senderName));
            if (replyToEnabled) {
                String replyEmail = StringUtils.hasText(replyToEmailOverride) ? replyToEmailOverride : senderEmail;
                String replyName = StringUtils.hasText(replyToNameOverride) ? replyToNameOverride : senderName;
                if (!isValidEmail(replyEmail)) {
                    log.warn("[BREVO] replyTo email invalid; omitting replyTo field kind={}", emailKind);
                } else {
                    payload.put("replyTo", Map.of("email", replyEmail, "name", replyName));
                }
            }
            payload.put("to", List.of(Map.of("email", to)));
            payload.put("subject", subject);
            if (StringUtils.hasText(htmlBody)) {
                payload.put("htmlContent", htmlBody);
            }
            payload.put("textContent", textBody != null ? textBody : "");

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = brevoRestTemplate.postForEntity(apiUrl, request, String.class);
            int status = response.getStatusCode().value();
            if (!response.getStatusCode().is2xxSuccessful()) {
                String body = sanitize(response.getBody());
                log.error(
                        "[BREVO FAILURE] kind={} httpStatus={} brevoSender={} intendedRecipient={} responseBody={}",
                        emailKind,
                        status,
                        maskEmail(senderEmail),
                        maskEmail(to),
                        body);
                return EmailSendOutcome.failedHttp(status, "non-2xx without exception: " + body);
            }
            String messageId = extractMessageId(response.getBody());
            log.info(
                    "[BREVO SUCCESS] kind={} httpStatus={} brevoSender={} intendedRecipient={} messageId={} responseBody={}",
                    emailKind,
                    status,
                    maskEmail(senderEmail),
                    maskEmail(to),
                    messageId != null ? messageId : "(none)",
                    sanitize(response.getBody()));
            return EmailSendOutcome.success(status, messageId);
        } catch (HttpStatusCodeException ex) {
            int code = ex.getStatusCode().value();
            String resp = sanitize(ex.getResponseBodyAsString());
            log.error(
                    "[BREVO FAILURE] kind={} httpStatus={} brevoSender={} intendedRecipient={} responseBody={}",
                    emailKind,
                    code,
                    maskEmail(senderEmail),
                    maskEmail(to),
                    resp);
            return EmailSendOutcome.failedHttp(code, resp);
        } catch (RestClientException ex) {
            String msg = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
            log.error(
                    "[BREVO FAILURE] kind={} networkOrClientError={} message={}",
                    emailKind,
                    ex.getClass().getSimpleName(),
                    msg,
                    ex);
            return EmailSendOutcome.failedNetwork(msg);
        }
    }

    private String extractMessageId(String responseBody) {
        if (!StringUtils.hasText(responseBody)) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode id = root.get("messageId");
            if (id != null && id.isTextual()) {
                return id.asText();
            }
        } catch (Exception ignored) {
            // fall through
        }
        return null;
    }

    /** Log-only preview when we intentionally do not call Brevo (mock credentials or missing recipient). */
    private void logIntentionalMockPreview(String to, String subject, String body, String reason) {
        log.info(
                "[BREVO MOCK PREVIEW] reason={}\nTo: {}\nSubject: {}\nBody:\n{}",
                reason,
                StringUtils.hasText(to) ? maskEmail(to) : "(none)",
                subject,
                body);
    }

    private static boolean isValidEmail(String email) {
        return email != null && EMAIL.matcher(email).matches();
    }

    /**
     * Trim, strip surrounding quotes, lowercase domain for DNS stability.
     */
    private static String normalizeEmailAddress(String raw) {
        if (raw == null) {
            return "";
        }
        String t = raw.trim();
        if (t.length() >= 2
                && ((t.charAt(0) == '"' && t.charAt(t.length() - 1) == '"')
                        || (t.charAt(0) == '\'' && t.charAt(t.length() - 1) == '\''))) {
            t = t.substring(1, t.length() - 1).trim();
        }
        int at = t.lastIndexOf('@');
        if (at > 0 && at < t.length() - 1) {
            String local = t.substring(0, at);
            String domain = t.substring(at + 1).toLowerCase(Locale.ROOT);
            return local + "@" + domain;
        }
        return t;
    }

    private static String maskEmail(String email) {
        if (!StringUtils.hasText(email) || !email.contains("@")) {
            return email;
        }
        int at = email.indexOf('@');
        String local = email.substring(0, at);
        String domain = email.substring(at + 1);
        String localMasked =
                local.length() <= 2 ? "***" : local.charAt(0) + "***" + local.charAt(local.length() - 1);
        return localMasked + "@" + domain;
    }

    private static String domainOf(String email) {
        int at = email.lastIndexOf('@');
        if (at < 0 || at == email.length() - 1) {
            return "";
        }
        return email.substring(at + 1).toLowerCase(Locale.ROOT);
    }

    private static boolean isFreemailDomain(String email) {
        return FREEMAIL_DOMAINS.contains(domainOf(email));
    }

    private static String sanitize(String input) {
        if (!StringUtils.hasText(input)) {
            return "(empty)";
        }
        String oneLine = input.replace('\n', ' ').replace('\r', ' ').trim();
        return oneLine.length() > 500 ? oneLine.substring(0, 500) + "...(truncated)" : oneLine;
    }

    private String buildMissionActionLink(String actionPath, String token) {
        if (!StringUtils.hasText(token) || !StringUtils.hasText(missionEmailAcceptBaseUrl)) {
            return null;
        }
        return missionEmailAcceptBaseUrl
                + "/api/missions/email-action/"
                + actionPath
                + "?token="
                + URLEncoder.encode(token.trim(), StandardCharsets.UTF_8);
    }

    private static String normalizeAcceptBaseUrl(String raw) {
        if (raw == null) {
            return "";
        }
        String t = raw.trim();
        while (t.endsWith("/")) {
            t = t.substring(0, t.length() - 1);
        }
        return t;
    }

    private static String buildMissionAssignedBody(Mission mission, String acceptLinkOrNull, String declineLinkOrNull) {
        StringBuilder sb = new StringBuilder();
        sb.append("You have been assigned a new support mission.\n\n");
        sb.append("Mission ID: ").append(mission.getId()).append("\n");
        sb.append("Patient ID: ").append(mission.getPatientId()).append("\n");
        sb.append("Alert type: ").append(mission.getAlertType()).append("\n");
        sb.append("Title: ").append(mission.getTitle()).append("\n");
        if (StringUtils.hasText(mission.getDescription())) {
            sb.append("Description: ").append(mission.getDescription()).append("\n");
        }
        sb.append("Status: ").append(mission.getStatus()).append("\n");
        sb.append("Step: ").append(mission.getStepNumber()).append("\n");
        if (StringUtils.hasText(acceptLinkOrNull)) {
            sb.append("\nAccept (link):\n").append(acceptLinkOrNull).append("\n");
        }
        if (StringUtils.hasText(declineLinkOrNull)) {
            sb.append("\nDecline (link):\n").append(declineLinkOrNull).append("\n");
        }
        sb.append("\nYou can also review pending missions in the application.");
        return sb.toString();
    }

    private static String buildMissionAssignedHtml(Mission mission, String acceptLink, String declineLink) {
        if (!StringUtils.hasText(acceptLink) && !StringUtils.hasText(declineLink)) {
            return null;
        }
        String descRow = "";
        if (StringUtils.hasText(mission.getDescription())) {
            descRow =
                    "<tr><td style=\"padding:6px 0;font-weight:bold;\">Description</td><td style=\"padding:6px 0;\">"
                            + esc(mission.getDescription())
                            + "</td></tr>";
        }
        String buttons = "";
        if (StringUtils.hasText(acceptLink)) {
            buttons +=
                    "<a href=\""
                            + esc(acceptLink)
                            + "\" style=\"background-color:#28a745;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;\">Accept Mission</a>";
        }
        if (StringUtils.hasText(declineLink)) {
            buttons +=
                    "<a href=\""
                            + esc(declineLink)
                            + "\" style=\"background-color:#dc3545;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;margin-left:10px;\">Decline Mission</a>";
        }
        String fallback = "";
        if (StringUtils.hasText(acceptLink)) {
            fallback += "<p style=\"font-size:13px;color:#555;\"><strong>Accept</strong><br/>" + esc(acceptLink) + "</p>";
        }
        if (StringUtils.hasText(declineLink)) {
            fallback += "<p style=\"font-size:13px;color:#555;\"><strong>Decline</strong><br/>" + esc(declineLink) + "</p>";
        }
        return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/><title>Mission assigned</title></head>"
                + "<body style=\"font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#222;\">"
                + "<h2 style=\"margin:0 0 12px;\">New mission assigned</h2>"
                + "<p style=\"margin:0 0 16px;\">You have been assigned a new support mission.</p>"
                + "<table style=\"border-collapse:collapse;margin:0 0 20px;max-width:560px;\">"
                + "<tr><td style=\"padding:6px 0;font-weight:bold;width:140px;\">Mission ID</td><td style=\"padding:6px 0;\">"
                + mission.getId()
                + "</td></tr>"
                + "<tr><td style=\"padding:6px 0;font-weight:bold;\">Patient ID</td><td style=\"padding:6px 0;\">"
                + mission.getPatientId()
                + "</td></tr>"
                + "<tr><td style=\"padding:6px 0;font-weight:bold;\">Alert type</td><td style=\"padding:6px 0;\">"
                + esc(String.valueOf(mission.getAlertType()))
                + "</td></tr>"
                + "<tr><td style=\"padding:6px 0;font-weight:bold;\">Title</td><td style=\"padding:6px 0;\">"
                + esc(mission.getTitle())
                + "</td></tr>"
                + descRow
                + "<tr><td style=\"padding:6px 0;font-weight:bold;\">Status</td><td style=\"padding:6px 0;\">"
                + esc(String.valueOf(mission.getStatus()))
                + "</td></tr>"
                + "<tr><td style=\"padding:6px 0;font-weight:bold;\">Step</td><td style=\"padding:6px 0;\">"
                + mission.getStepNumber()
                + "</td></tr>"
                + "</table>"
                + "<p style=\"margin:0 0 12px;\">"
                + buttons
                + "</p>"
                + "<p style=\"font-size:13px;color:#666;margin:16px 0 8px;\">If the buttons do not work, use these links:</p>"
                + fallback
                + "<p style=\"font-size:13px;color:#666;margin-top:20px;\">You can also review pending missions in the application.</p>"
                + "</body></html>";
    }

    private static String esc(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private static String buildEscalationBody(String message) {
        StringBuilder sb = new StringBuilder();
        sb.append("Final escalation: no responder accepted the mission before timeouts elapsed.\n\n");
        if (StringUtils.hasText(message)) {
            sb.append("\nDetails: ").append(message);
        }
        return sb.toString();
    }
}
