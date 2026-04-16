package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.dto.mail.EmailSendOutcome;
import com.alzheimer.supportnetwork.dto.mail.EmailSendStatus;
import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.domain.MissionStatus;
import com.alzheimer.supportnetwork.entity.Mission;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("EmailNotificationService — Brevo HTTP behaviour")
class EmailNotificationServiceTest {

    @Mock private RestTemplate brevoRestTemplate;

    private EmailNotificationService service;

    private Mission sampleMission() {
        return Mission.builder()
                .id(10L)
                .patientId(1L)
                .assignedMemberId(5L)
                .alertType(AlertType.MALAISE)
                .title("T")
                .description("D")
                .status(MissionStatus.PENDING)
                .stepNumber(1)
                .createdAt(java.time.LocalDateTime.now())
                .build();
    }

    @BeforeEach
    void createService() {
        service =
                new EmailNotificationService(
                        brevoRestTemplate,
                        "xkeysib-test-key",
                        "https://api.brevo.com/v3/smtp/email",
                        "sender@verified.example.com",
                        "Support",
                        5000,
                        10000,
                        true,
                        "",
                        "",
                        true,
                        true,
                        true,
                        "http://localhost:8082");
    }

    @Nested
    class MockMode {

        @Test
        @DisplayName("GIVEN empty API key WHEN send mission email THEN mock mode, no HTTP")
        void missingApiKey() {
            EmailNotificationService s =
                    new EmailNotificationService(
                            brevoRestTemplate,
                            "",
                            "https://api.brevo.com/v3/smtp/email",
                            "sender@verified.example.com",
                            "Support",
                            5000,
                            10000,
                            true,
                            "",
                            "",
                            true,
                            true,
                            true,
                            "http://localhost:8082");
            EmailSendOutcome o = s.sendMissionAssignedEmail("recipient@example.com", sampleMission(), "tok1", "tok2");
            assertThat(o.status()).isEqualTo(EmailSendStatus.SKIPPED_MOCK_MODE);
            verify(brevoRestTemplate, never()).postForEntity(anyString(), any(), org.mockito.ArgumentMatchers.<Class<String>>any());
        }

        @Test
        @DisplayName("GIVEN xsmtpsib SMTP relay key WHEN send THEN mock mode, no HTTP (wrong credential type for REST)")
        void smtpKeyNotUsableForRestApi() {
            EmailNotificationService s =
                    new EmailNotificationService(
                            brevoRestTemplate,
                            "xsmtpsib-fake-smtp-relay-key",
                            "https://api.brevo.com/v3/smtp/email",
                            "sender@verified.example.com",
                            "Support",
                            5000,
                            10000,
                            true,
                            "",
                            "",
                            true,
                            true,
                            true,
                            "http://localhost:8082");
            EmailSendOutcome o = s.sendMissionAssignedEmail("recipient@example.com", sampleMission(), "tok1", "tok2");
            assertThat(o.status()).isEqualTo(EmailSendStatus.SKIPPED_MOCK_MODE);
            assertThat(o.detail()).contains("xsmtpsib");
            verify(brevoRestTemplate, never()).postForEntity(anyString(), any(), org.mockito.ArgumentMatchers.<Class<String>>any());
        }

        @Test
        @DisplayName("GIVEN invalid sender WHEN send THEN mock mode")
        void invalidSender() {
            EmailNotificationService s =
                    new EmailNotificationService(
                            brevoRestTemplate,
                            "key",
                            "https://api.brevo.com/v3/smtp/email",
                            "not-an-email",
                            "Support",
                            5000,
                            10000,
                            true,
                            "",
                            "",
                            true,
                            true,
                            true,
                            "http://localhost:8082");
            EmailSendOutcome o = s.sendMissionAssignedEmail("recipient@example.com", sampleMission(), "a", "b");
            assertThat(o.status()).isEqualTo(EmailSendStatus.SKIPPED_MOCK_MODE);
            verify(brevoRestTemplate, never()).postForEntity(anyString(), any(), org.mockito.ArgumentMatchers.<Class<String>>any());
        }
    }

    @Nested
    class Validation {

        @Test
        @DisplayName("GIVEN blank recipient WHEN send mission email THEN skipped")
        void blankRecipient() {
            EmailSendOutcome o = service.sendMissionAssignedEmail("   ", sampleMission(), "a", "b");
            assertThat(o.status()).isEqualTo(EmailSendStatus.SKIPPED_NO_RECIPIENT);
            verify(brevoRestTemplate, never()).postForEntity(anyString(), any(), org.mockito.ArgumentMatchers.<Class<String>>any());
        }

        @Test
        @DisplayName("GIVEN null mission WHEN send THEN skipped")
        void nullMission() {
            EmailSendOutcome o = service.sendMissionAssignedEmail("a@b.com", null, "a", "b");
            assertThat(o.status()).isEqualTo(EmailSendStatus.SKIPPED_NULL_MISSION);
        }
    }

    @Nested
    class HttpCalls {

        @BeforeEach
        void resetRestTemplate() {
            Mockito.reset(brevoRestTemplate);
        }

        @Test
        @DisplayName("GIVEN Brevo returns 201 WHEN send THEN success outcome")
        void success() {
            when(brevoRestTemplate.postForEntity(
                            eq("https://api.brevo.com/v3/smtp/email"),
                            any(),
                            org.mockito.ArgumentMatchers.<Class<String>>any()))
                    .thenReturn(ResponseEntity.status(HttpStatus.CREATED).body("{\"messageId\":\"mid-1\"}"));

            EmailSendOutcome o =
                    service.sendMissionAssignedEmail("recipient@example.com", sampleMission(), "tokA", "tokB");
            assertThat(o.delivered()).isTrue();
            assertThat(o.httpStatus()).isEqualTo(201);
            assertThat(o.brevoMessageId()).isEqualTo("mid-1");

            ArgumentCaptor<org.springframework.http.HttpEntity<Map<String, Object>>> captor =
                    ArgumentCaptor.forClass(org.springframework.http.HttpEntity.class);
            verify(brevoRestTemplate)
                    .postForEntity(
                            eq("https://api.brevo.com/v3/smtp/email"),
                            captor.capture(),
                            org.mockito.ArgumentMatchers.<Class<String>>any());
            assertThat(captor.getValue().getHeaders().getFirst("api-key")).isEqualTo("xkeysib-test-key");
            @SuppressWarnings("unchecked")
            Map<String, Object> body = (Map<String, Object>) captor.getValue().getBody();
            assertThat(body.get("subject")).isNotNull();
            assertThat(body.get("htmlContent")).isNotNull();
        }

        @Test
        @DisplayName("GIVEN Brevo 400 WHEN send THEN failed_http outcome")
        void brevoClientError() {
            doThrow(
                            HttpClientErrorException.create(
                                    HttpStatus.BAD_REQUEST,
                                    "Bad Request",
                                    null,
                                    "{\"message\":\"invalid\"}".getBytes(StandardCharsets.UTF_8),
                                    StandardCharsets.UTF_8))
                    .when(brevoRestTemplate)
                    .postForEntity(anyString(), any(), org.mockito.ArgumentMatchers.<Class<String>>any());

            EmailSendOutcome o = service.sendAlertTriggeredEmail("admin@example.com", 99L, "MALAISE");
            assertThat(o.status()).isEqualTo(EmailSendStatus.FAILED_HTTP);
            assertThat(o.httpStatus()).isEqualTo(400);
            assertThat(o.detail()).contains("invalid");
        }

        @Test
        @DisplayName("GIVEN network error WHEN send THEN failed_network")
        void networkError() {
            doThrow(new ResourceAccessException("timeout"))
                    .when(brevoRestTemplate)
                    .postForEntity(anyString(), any(), org.mockito.ArgumentMatchers.<Class<String>>any());

            EmailSendOutcome o = service.sendEscalationEmail("admin@example.com", "msg");
            assertThat(o.status()).isEqualTo(EmailSendStatus.FAILED_NETWORK);
            assertThat(o.detail()).contains("timeout");
        }
    }
}
