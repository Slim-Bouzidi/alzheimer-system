package com.alzheimer.userservice.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class JwtUtils {
    
    /**
     * Extract Keycloak ID from JWT subject claim.
     * 
     * @param jwt The JWT token
     * @return The Keycloak user ID (sub claim)
     */
    public String extractKeycloakId(Jwt jwt) {
        String keycloakId = jwt.getSubject();
        log.debug("Extracted keycloakId from JWT: {}", keycloakId);
        return keycloakId;
    }
    
    /**
     * Extract email from JWT email claim.
     * 
     * @param jwt The JWT token
     * @return The email address, or null if not present
     */
    public String extractEmail(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        log.debug("Extracted email from JWT: {}", email);
        return email;
    }
    
    /**
     * Extract role from JWT realm_access roles, filtering out default Keycloak roles.
     * Default Keycloak roles to filter: offline_access, uma_authorization, default-roles-*
     * 
     * @param jwt The JWT token
     * @return The application role, or "PATIENT" as default
     */
    public String extractRole(Jwt jwt) {
        try {
            // Try to get realm_access roles
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                @SuppressWarnings("unchecked")
                List<String> roles = (List<String>) realmAccess.get("roles");
                
                // Filter out default Keycloak roles
                String role = roles.stream()
                    .filter(r -> !isDefaultKeycloakRole(r))
                    .findFirst()
                    .orElse("PATIENT");
                
                log.debug("Extracted role from JWT: {}", role);
                return role;
            }
        } catch (Exception e) {
            log.warn("Failed to extract role from JWT, using default: {}", e.getMessage());
        }
        
        // Default to PATIENT if no role found
        return "PATIENT";
    }
    
    /**
     * Check if a role is a default Keycloak role that should be filtered out.
     * 
     * @param role The role to check
     * @return true if it's a default Keycloak role
     */
    private boolean isDefaultKeycloakRole(String role) {
        return role.equals("offline_access") 
            || role.equals("uma_authorization")
            || role.startsWith("default-roles-");
    }
}
