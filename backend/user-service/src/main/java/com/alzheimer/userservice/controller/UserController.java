package com.alzheimer.userservice.controller;

import com.alzheimer.userservice.dto.UserRegistrationRequest;
import com.alzheimer.userservice.dto.UserResponse;
import com.alzheimer.userservice.dto.UserSyncRequest;
import com.alzheimer.userservice.entity.Role;
import com.alzheimer.userservice.entity.User;
import com.alzheimer.userservice.exception.KeycloakServiceException;
import com.alzheimer.userservice.repository.UserRepository;
import com.alzheimer.userservice.service.UserRegistrationService;
import com.alzheimer.userservice.service.UserSynchronizationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@Validated
@Slf4j
public class UserController {

    private final UserRegistrationService userRegistrationService;
    private final UserSynchronizationService userSynchronizationService;
    private final UserRepository userRepository;

    @Autowired
    public UserController(UserRegistrationService userRegistrationService,
                         UserSynchronizationService userSynchronizationService,
                         UserRepository userRepository) {
        this.userRegistrationService = userRegistrationService;
        this.userSynchronizationService = userSynchronizationService;
        this.userRepository = userRepository;
    }

    /**
     * Register a new user
     * 
     * @param request User registration request
     * @return UserResponse with created user details
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationRequest request) {
        log.info("Received registration request for email: {}", request.getEmail());

        try {
            UserResponse response = userRegistrationService.registerUser(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.warn("Registration validation failed: {}", e.getMessage());
            
            // Return 400 Bad Request for invalid email or role
            if (e.getMessage().contains("Invalid email") || e.getMessage().contains("Invalid role")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse(e.getMessage()));
            }
            
            // Return 409 Conflict for duplicate email
            if (e.getMessage().contains("already registered")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(createErrorResponse(e.getMessage()));
            }
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));

        } catch (KeycloakServiceException e) {
            log.error("Keycloak service error during registration: {}", e.getMessage());
            
            // Return 503 Service Unavailable for Keycloak failures
            if (e.getMessage().contains("temporarily unavailable")) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(createErrorResponse("Authentication service temporarily unavailable"));
            }
            
            // Return 409 Conflict if user already exists in Keycloak
            if (e.getMessage().contains("already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(createErrorResponse("Email already registered"));
            }
            
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(createErrorResponse("Failed to create user account"));

        } catch (Exception e) {
            log.error("Unexpected error during registration", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("An unexpected error occurred"));
        }
    }

    /**
     * Creates a standardized error response
     * 
     * @param message Error message
     * @return Map containing error details
     */
    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }

    /**
     * Synchronize user from JWT claims (internal endpoint)
     * 
     * @param request User synchronization request
     * @return UserResponse with synchronized user details
     */
    @PostMapping("/sync")
    public ResponseEntity<UserResponse> synchronizeUser(@Valid @RequestBody UserSyncRequest request) {
        log.info("Received synchronization request for keycloakId: {}", request.getKeycloakId());

        try {
            User user = userSynchronizationService.synchronizeUser(
                request.getKeycloakId(),
                request.getEmail(),
                request.getRole()
            );

            UserResponse response = UserResponse.builder()
                .id(user.getId())
                .keycloakId(user.getKeycloakId())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            log.error("Error during user synchronization", e);
            throw new RuntimeException("Failed to synchronize user: " + e.getMessage());
        }
    }

    /**
     * Get user by application ID
     * 
     * @param id User ID
     * @return UserResponse with user details
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        log.info("Received request to get user by id: {}", id);

        Optional<User> userOptional = userRepository.findById(id);
        
        if (userOptional.isEmpty()) {
            log.warn("User not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("User not found with id: " + id));
        }

        User user = userOptional.get();
        UserResponse response = mapToUserResponse(user);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get user by Keycloak ID (used for synchronization queries)
     * 
     * @param keycloakId Keycloak user ID
     * @return UserResponse with user details
     */
    @GetMapping("/by-keycloak-id/{keycloakId}")
    public ResponseEntity<?> getUserByKeycloakId(@PathVariable String keycloakId) {
        log.info("Received request to get user by keycloakId: {}", keycloakId);

        Optional<User> userOptional = userRepository.findByKeycloakId(keycloakId);
        
        if (userOptional.isEmpty()) {
            log.warn("User not found with keycloakId: {}", keycloakId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("User not found with keycloakId: " + keycloakId));
        }

        User user = userOptional.get();
        UserResponse response = mapToUserResponse(user);
        
        return ResponseEntity.ok(response);
    }

    /**
     * List all users with optional role filter (admin only)
     * 
     * @param role Optional role filter
     * @return List of UserResponse objects
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(@RequestParam(required = false) Role role) {
        log.info("Received request to list all users with role filter: {}", role);

        List<User> users;
        
        if (role != null) {
            users = userRepository.findAll().stream()
                    .filter(user -> user.getRole() == role)
                    .collect(Collectors.toList());
        } else {
            users = userRepository.findAll();
        }

        List<UserResponse> responses = users.stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * Maps User entity to UserResponse DTO
     * 
     * @param user User entity
     * @return UserResponse DTO
     */
    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .keycloakId(user.getKeycloakId())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
