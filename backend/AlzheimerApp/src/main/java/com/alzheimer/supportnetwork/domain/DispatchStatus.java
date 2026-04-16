package com.alzheimer.supportnetwork.domain;

/** Lifecycle of a persisted dispatch record (alert → plan snapshot → mission link). */
public enum DispatchStatus {
    CREATED,
    IN_PROGRESS,
    COMPLETED,
    ESCALATED,
    CANCELLED
}
