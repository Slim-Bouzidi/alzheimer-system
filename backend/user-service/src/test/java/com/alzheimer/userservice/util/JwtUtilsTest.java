package com.alzheimer.userservice.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
    }

    @Test
    void extractKeycloakId_ValidJwt_ReturnsSubject() {
        // Given
        Jwt jwt = createJwtWithSubject("test-keycloak-id");

        // When
        String keycloakId = jwtUtils.extractKeycloakId(jwt);

        // Then
        assertEquals("test-keycloak-id", keycloakId);
    }

    @Test
    void extractEmail_ValidJwt_ReturnsEmail() {
        // Given
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", "test@example.com");
        Jwt jwt = createJwt("test-sub", claims);

        // When
        String email = jwtUtils.extractEmail(jwt);

        // Then
        assertEquals("test@example.com", email);
    }

    @Test
    void extractEmail_NoEmailClaim_ReturnsNull() {
        // Given
        Jwt jwt = createJwtWithSubject("test-sub");

        // When
        String email = jwtUtils.extractEmail(jwt);

        // Then
        assertNull(email);
    }

    @Test
    void extractRole_ValidRoleInRealmAccess_ReturnsRole() {
        // Given
        Map<String, Object> realmAccess = new HashMap<>();
        realmAccess.put("roles", List.of("DOCTOR", "offline_access", "uma_authorization"));
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("realm_access", realmAccess);
        
        Jwt jwt = createJwt("test-sub", claims);

        // When
        String role = jwtUtils.extractRole(jwt);

        // Then
        assertEquals("DOCTOR", role);
    }

    @Test
    void extractRole_FiltersDefaultKeycloakRoles_ReturnsApplicationRole() {
        // Given
        Map<String, Object> realmAccess = new HashMap<>();
        realmAccess.put("roles", List.of("offline_access", "uma_authorization", "PATIENT"));
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("realm_access", realmAccess);
        
        Jwt jwt = createJwt("test-sub", claims);

        // When
        String role = jwtUtils.extractRole(jwt);

        // Then
        assertEquals("PATIENT", role);
    }

    @Test
    void extractRole_FiltersDefaultRolesPrefix_ReturnsApplicationRole() {
        // Given
        Map<String, Object> realmAccess = new HashMap<>();
        realmAccess.put("roles", List.of("default-roles-alzheimer", "ADMIN"));
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("realm_access", realmAccess);
        
        Jwt jwt = createJwt("test-sub", claims);

        // When
        String role = jwtUtils.extractRole(jwt);

        // Then
        assertEquals("ADMIN", role);
    }

    @Test
    void extractRole_NoRealmAccess_ReturnsDefaultRole() {
        // Given
        Jwt jwt = createJwtWithSubject("test-sub");

        // When
        String role = jwtUtils.extractRole(jwt);

        // Then
        assertEquals("PATIENT", role);
    }

    @Test
    void extractRole_OnlyDefaultRoles_ReturnsDefaultRole() {
        // Given
        Map<String, Object> realmAccess = new HashMap<>();
        realmAccess.put("roles", List.of("offline_access", "uma_authorization", "default-roles-test"));
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("realm_access", realmAccess);
        
        Jwt jwt = createJwt("test-sub", claims);

        // When
        String role = jwtUtils.extractRole(jwt);

        // Then
        assertEquals("PATIENT", role);
    }

    @Test
    void extractRole_EmptyRolesList_ReturnsDefaultRole() {
        // Given
        Map<String, Object> realmAccess = new HashMap<>();
        realmAccess.put("roles", List.of());
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("realm_access", realmAccess);
        
        Jwt jwt = createJwt("test-sub", claims);

        // When
        String role = jwtUtils.extractRole(jwt);

        // Then
        assertEquals("PATIENT", role);
    }

    // Helper methods to create test JWTs
    private Jwt createJwtWithSubject(String subject) {
        return createJwt(subject, new HashMap<>());
    }

    private Jwt createJwt(String subject, Map<String, Object> claims) {
        Map<String, Object> headers = new HashMap<>();
        headers.put("alg", "RS256");
        
        return new Jwt(
            "token-value",
            Instant.now(),
            Instant.now().plusSeconds(3600),
            headers,
            mergeClaims(subject, claims)
        );
    }

    private Map<String, Object> mergeClaims(String subject, Map<String, Object> additionalClaims) {
        Map<String, Object> claims = new HashMap<>(additionalClaims);
        claims.put("sub", subject);
        return claims;
    }
}
