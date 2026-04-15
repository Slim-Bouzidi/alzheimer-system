package com.alzheimer.userservice.service;

import com.alzheimer.userservice.dto.UserRegistrationRequest;
import com.alzheimer.userservice.dto.UserResponse;
import com.alzheimer.userservice.entity.Role;
import com.alzheimer.userservice.entity.User;
import com.alzheimer.userservice.exception.KeycloakServiceException;
import com.alzheimer.userservice.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@Slf4j
public class UserRegistrationService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final UserRepository userRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final RestTemplate restTemplate;

    @Value("${patient.service.url:http://localhost:8082}")
    private String patientServiceUrl;

    @Autowired
    public UserRegistrationService(
            UserRepository userRepository,
            KeycloakAdminService keycloakAdminService,
            RestTemplate restTemplate) {
        this.userRepository = userRepository;
        this.keycloakAdminService = keycloakAdminService;
        this.restTemplate = restTemplate;
    }

    /**
     * Registers a new user by creating Keycloak user and application user record
     * 
     * @param request User registration request
     * @return UserResponse with created user details
     * @throws IllegalArgumentException if validation fails
     * @throws KeycloakServiceException if Keycloak operations fail
     */
    @Transactional
    public UserResponse registerUser(UserRegistrationRequest request) {
        log.info("Starting user registration for email: {}", request.getEmail());

        // 1. Validate registration request
        validateRegistrationRequest(request);

        String keycloakId = null;
        try {
            // 2. Create Keycloak user
            keycloakId = createKeycloakUser(request);

            // 3. Create application user record
            User user = createUserRecord(keycloakId, request);

            // 4. If role is PATIENT, create patient record
            if (request.getRole() == Role.PATIENT) {
                createPatientRecord(user.getId(), request);
            }

            log.info("Successfully registered user with ID: {} and Keycloak ID: {}", user.getId(), keycloakId);
            return mapToResponse(user);

        } catch (Exception e) {
            // Rollback: delete Keycloak user if database save fails
            if (keycloakId != null) {
                log.warn("Rolling back Keycloak user creation due to error: {}", e.getMessage());
                try {
                    keycloakAdminService.deleteKeycloakUser(keycloakId);
                } catch (Exception rollbackException) {
                    log.error("Failed to rollback Keycloak user creation for ID: {}", keycloakId, rollbackException);
                }
            }
            throw e;
        }
    }

    /**
     * Validates registration request for email format and valid role
     * 
     * @param request User registration request
     * @throws IllegalArgumentException if validation fails
     */
    void validateRegistrationRequest(UserRegistrationRequest request) {
        log.debug("Validating registration request for email: {}", request.getEmail());

        // Check email format
        if (request.getEmail() == null || !EMAIL_PATTERN.matcher(request.getEmail()).matches()) {
            throw new IllegalArgumentException("Invalid email format");
        }

        // Check valid role
        if (request.getRole() == null) {
            throw new IllegalArgumentException("Invalid role. Must be one of: ADMIN, DOCTOR, CAREGIVER, PATIENT");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        log.debug("Registration request validation passed for email: {}", request.getEmail());
    }

    /**
     * Creates a Keycloak user with credentials and role assignment
     * 
     * @param request User registration request
     * @return Keycloak user ID
     * @throws KeycloakServiceException if Keycloak operations fail
     */
    String createKeycloakUser(UserRegistrationRequest request) {
        log.debug("Creating Keycloak user for email: {}", request.getEmail());

        // Create user in Keycloak
        String keycloakId = keycloakAdminService.createKeycloakUser(
                request.getEmail(),
                request.getFirstName(),
                request.getLastName()
        );

        // Set password
        keycloakAdminService.setPassword(keycloakId, request.getPassword());

        // Assign realm role
        keycloakAdminService.assignRealmRole(keycloakId, request.getRole());

        log.debug("Successfully created Keycloak user with ID: {}", keycloakId);
        return keycloakId;
    }

    /**
     * Creates user record in database with keycloak_id from JWT sub claim
     * 
     * @param keycloakId Keycloak user ID (from JWT sub claim)
     * @param request User registration request
     * @return Created User entity
     */
    User createUserRecord(String keycloakId, UserRegistrationRequest request) {
        log.debug("Creating user record for Keycloak ID: {}", keycloakId);

        User user = User.builder()
                .keycloakId(keycloakId)
                .email(request.getEmail())
                .role(request.getRole())
                .build();

        user = userRepository.save(user);
        log.debug("Successfully created user record with ID: {}", user.getId());
        return user;
    }

    /**
     * Creates patient record by calling Patient Service
     * 
     * @param userId Application user ID
     * @param request User registration request
     */
    void createPatientRecord(Long userId, UserRegistrationRequest request) {
        log.debug("Creating patient record for user ID: {}", userId);

        try {
            String url = patientServiceUrl + "/api/patients";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> patientRequest = new HashMap<>();
            patientRequest.put("userId", userId);
            patientRequest.put("firstName", request.getFirstName());
            patientRequest.put("lastName", request.getLastName());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(patientRequest, headers);

            restTemplate.postForEntity(url, entity, Object.class);
            log.info("Successfully created patient record for user ID: {}", userId);

        } catch (RestClientException e) {
            // Handle Patient Service unavailability gracefully
            log.warn("Patient Service unavailable during registration for user ID: {}. Patient record not created: {}",
                    userId, e.getMessage());
            // Return success for user creation even if patient creation fails
        }
    }

    /**
     * Maps User entity to UserResponse DTO
     * 
     * @param user User entity
     * @return UserResponse DTO
     */
    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .keycloakId(user.getKeycloakId())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
