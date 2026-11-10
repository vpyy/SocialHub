package com.socialhub.common.exception;

import lombok.Getter;

/**
 * Exception for token-related errors
 * Codes: TOKEN_EXPIRED, TOKEN_REVOKED, TOKEN_REUSED
 */
@Getter
public class TokenException extends RuntimeException {

    private final String code;
    private final int statusCode;

    public TokenException(String code, String message) {
        super(message);
        this.code = code;
        this.statusCode = 401; // All token errors are 401 Unauthorized
    }

    public TokenException(String code) {
        super("Token error: " + code);
        this.code = code;
        this.statusCode = 401;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
