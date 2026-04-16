package com.alzheimer.supportnetwork.dto.mail;

import java.util.Objects;

/** Result of {@link com.alzheimer.supportnetwork.service.EmailNotificationService} send methods. */
public record EmailSendOutcome(
        EmailSendStatus status,
        String detail,
        Integer httpStatus,
        String brevoMessageId) {

    public EmailSendOutcome {
        Objects.requireNonNull(status, "status");
    }

    public static EmailSendOutcome success(int httpStatus, String brevoMessageId) {
        return new EmailSendOutcome(EmailSendStatus.SUCCESS, null, httpStatus, brevoMessageId);
    }

    public static EmailSendOutcome skipped(EmailSendStatus status, String detail) {
        return new EmailSendOutcome(status, detail, null, null);
    }

    public static EmailSendOutcome mockMode(String reason) {
        return new EmailSendOutcome(EmailSendStatus.SKIPPED_MOCK_MODE, reason, null, null);
    }

    public static EmailSendOutcome failedHttp(int httpStatus, String detail) {
        return new EmailSendOutcome(EmailSendStatus.FAILED_HTTP, detail, httpStatus, null);
    }

    public static EmailSendOutcome failedNetwork(String detail) {
        return new EmailSendOutcome(EmailSendStatus.FAILED_NETWORK, detail, null, null);
    }

    public boolean delivered() {
        return status.isDelivered();
    }
}
