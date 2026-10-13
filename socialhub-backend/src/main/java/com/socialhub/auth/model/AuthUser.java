package com.socialhub.auth.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.security.core.Authentication;

/**
 * Auth User Model for JWT
 */
@Data
@AllArgsConstructor
public class AuthUser {
    
    private String userId;
    private String username;
    
    public static AuthUser fromAuthentication(Authentication auth) {
        if (auth == null) {
            return null;
        }
        return new AuthUser((String) auth.getPrincipal(), (String) auth.getPrincipal());
    }
}
