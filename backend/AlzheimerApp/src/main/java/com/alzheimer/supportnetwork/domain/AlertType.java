package com.alzheimer.supportnetwork.domain;

/**
 * Alert type for dispatch planning. Permission gates are defined in
 * {@link com.alzheimer.supportnetwork.service.AlertDispatchPlannerService} (backend SSOT).
 */
public enum AlertType {
    /** Dispatch filter: requires HOME_ACCESS permission or {@code canAccessHome} on the link. */
    CHUTE,
    /** Dispatch filter: requires GPS_VIEW permission on the link. */
    FUGUE,
    /**
     * Dispatch filter: no extra permission requirement — all links pass this gate.
     * (Optional MEDICAL_NOTES on a link is unrelated; it is not enforced here.)
     */
    MALAISE,
    /**
     * Behaviour-related alert; same permissive dispatch gate as {@link #MALAISE}.
     */
    COMPORTEMENT
}
