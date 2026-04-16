package com.alzheimer.supportnetwork.domain;

/** State of one assignee slot within a persisted dispatch step. */
public enum DispatchStepStatus {
    PENDING,
    ASSIGNED,
    ACCEPTED,
    SKIPPED,
    COMPLETED
}
