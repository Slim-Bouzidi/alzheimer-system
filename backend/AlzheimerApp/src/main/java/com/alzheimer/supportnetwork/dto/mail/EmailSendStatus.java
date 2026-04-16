package com.alzheimer.supportnetwork.dto.mail;

/** Outcome of a transactional email attempt (Brevo HTTP API). */
public enum EmailSendStatus {
    /** Feature toggle turned off in configuration. */
    SKIPPED_DISABLED,
    /** Mission payload was null (mission-assigned flow only). */
    SKIPPED_NULL_MISSION,
    /** Recipient missing or blank after normalization. */
    SKIPPED_NO_RECIPIENT,
    /** Recipient present but failed RFC-like validation. */
    SKIPPED_INVALID_RECIPIENT,
    /** No API call: missing/invalid Brevo credentials (mock / log-only path). */
    SKIPPED_MOCK_MODE,
    /** Brevo accepted the message (HTTP 2xx). */
    SUCCESS,
    /** Brevo or proxy returned a non-2xx HTTP status. */
    FAILED_HTTP,
    /** Connection timeout, DNS, TLS, or other client-side failure. */
    FAILED_NETWORK;

    public boolean isDelivered() {
        return this == SUCCESS;
    }
}
