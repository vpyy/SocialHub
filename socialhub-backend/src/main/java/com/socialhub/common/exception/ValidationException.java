package com.socialhub.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown for validation errors
 */
public class ValidationException extends ApiException {
    public ValidationException(String message) {
        super(message, "VALIDATION_ERROR", HttpStatus.BAD_REQUEST.value());
    }

    public ValidationException(String message, Throwable cause) {
        super(message, "VALIDATION_ERROR", HttpStatus.BAD_REQUEST.value(), cause);
    }
}
