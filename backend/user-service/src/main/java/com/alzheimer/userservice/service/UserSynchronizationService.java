package com.alzheimer.userservice.service;

import com.alzheimer.userservice.entity.Role;
import com.alzheimer.userservice.entity.User;
import com.alzheimer.userservice.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Slf4j
public class UserSynchronizationService {
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Synchronize user from JWT claims. Creates user if not found.
     * Handles concurrent synchronization with unique constraint.
     * 
     * @param keycloakId The Keycloak user ID from JWT sub claim
     * @param email The email from JWT claims (or default)
     * @param role The role from JWT claims (or default)
     * @return The synchronized user
     */
    @Transactional
    public User synchronizeUser(String keycloakId, String email, String role) {
        log.debug("Synchronizing user with keycloakId: {}", keycloakId);
        
        // Try to find existing user
        return userRepository.findByKeycloakId(keycloakId)
            .orElseGet(() -> createUserFromJwt(keycloakId, email, role));
    }
    
    /**
     * Create user record from JWT claims.
     * Handles concurrent creation attempts with unique constraint exception.
     * 
     * @param keycloakId The Keycloak user ID
     * @param email The user email
     * @param role The user role
     * @return The created user
     */
    private User createUserFromJwt(String keycloakId, String email, String role) {
        try {
            log.info("Creating new user from JWT claims - keycloakId: {}, email: {}, role: {}", 
                keycloakId, email, role);
            
            User user = User.builder()
                .keycloakId(keycloakId)
                .email(email != null ? email : keycloakId + "@default.local")
                .role(Role.valueOf(role != null ? role : "PATIENT"))
                .createdAt(LocalDateTime.now())
                .build();
            
            return userRepository.save(user);
            
        } catch (DataIntegrityViolationException e) {
            // Handle concurrent creation - another thread created the user
            log.warn("Concurrent user creation detected for keycloakId: {}. Fetching existing user.", keycloakId);
            return userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User creation failed and user not found: " + keycloakId));
        }
    }
}
