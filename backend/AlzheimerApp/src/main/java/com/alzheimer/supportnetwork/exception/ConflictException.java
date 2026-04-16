package com.alzheimer.supportnetwork.exception;

/** Business rule conflict (e.g. duplicate link), maps to HTTP 409. */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
