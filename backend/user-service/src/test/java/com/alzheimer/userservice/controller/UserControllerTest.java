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
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@WithMockUser
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRegistrationService userRegistrationService;

    @MockBean
    private UserSynchronizationService userSynchronizationService;

    @MockBean
    private UserRepository userRepository;

    private UserRegistrationRequest validRequest;
    private UserResponse mockResponse;

    @BeforeEach
    void setUp() {
        validRequest = UserRegistrationRequest.builder()
                .email("test@example.com")
                .password("Password123!")
                .firstName("John")
                .lastName("Doe")
                .role(Role.PATIENT)
                .build();

        mockResponse = UserResponse.builder()
                .id(1L)
                .keycloakId("keycloak-uuid-123")
                .email("test@example.com")
                .role(Role.PATIENT)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void testRegisterUser_ValidRequest_Returns201Created() throws Exception {
        // Given
        when(userRegistrationService.registerUser(any(UserRegistrationRequest.class)))
                .thenReturn(mockResponse);

        // When & Then
        mockMvc.perform(post("/api/users/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.keycloakId").value("keycloak-uuid-123"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.role").value("PATIENT"));
    }

    @Test
    void testRegisterUser_InvalidEmail_Returns400BadRequest() throws Exception {
        // Given
        when(userRegistrationService.registerUser(any(UserRegistrationRequest.class)))
                .thenThrow(new IllegalArgumentException("Invalid email format"));

        // When & Then
        mockMvc.perform(post("/api/users/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid email format"));
    }

    @Test
    void testRegisterUser_InvalidRole_Returns400BadRequest() throws Exception {
        // Given
        when(userRegistrationService.registerUser(any(UserRegistrationRequest.class)))
                .thenThrow(new IllegalArgumentException("Invalid role. Must be one of: ADMIN, DOCTOR, CAREGIVER, PATIENT"));

        // When & Then
        mockMvc.perform(post("/api/users/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void testRegisterUser_DuplicateEmail_Returns409Conflict() throws Exception {
        // Given
        when(userRegistrationService.registerUser(any(UserRegistrationRequest.class)))
                .thenThrow(new IllegalArgumentException("Email already registered"));

        // When & Then
        mockMvc.perform(post("/api/users/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Email already registered"));
    }

    @Test
    void testRegisterUser_KeycloakUnavailable_Returns503ServiceUnavailable() throws Exception {
        // Given
        when(userRegistrationService.registerUser(any(UserRegistrationRequest.class)))
                .thenThrow(new KeycloakServiceException("Authentication service temporarily unavailable"));

        // When & Then
        mockMvc.perform(post("/api/users/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("Authentication service temporarily unavailable"));
    }

    @Test
    void testRegisterUser_KeycloakUserExists_Returns409Conflict() throws Exception {
        // Given
        when(userRegistrationService.registerUser(any(UserRegistrationRequest.class)))
                .thenThrow(new KeycloakServiceException("User with email test@example.com already exists in Keycloak"));

        // When & Then
        mockMvc.perform(post("/api/users/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Email already registered"));
    }

    @Test
    void testRegisterUser_MissingRequiredFields_Returns400BadRequest() throws Exception {
        // Given
        UserRegistrationRequest invalidRequest = UserRegistrationRequest.builder()
                .email("test@example.com")
                // Missing password, firstName, lastName, role
                .build();

        // When & Then
        mockMvc.perform(post("/api/users/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testRegisterUser_InvalidEmailFormat_Returns400BadRequest() throws Exception {
        // Given
        validRequest.setEmail("invalid-email");

        // When & Then
        mockMvc.perform(post("/api/users/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testRegisterUser_PasswordTooShort_Returns400BadRequest() throws Exception {
        // Given
        validRequest.setPassword("short");

        // When & Then
        mockMvc.perform(post("/api/users/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSynchronizeUser_ValidRequest_Returns201Created() throws Exception {
        // Given
        UserSyncRequest syncRequest = UserSyncRequest.builder()
                .keycloakId("keycloak-uuid-123")
                .email("sync@example.com")
                .role("DOCTOR")
                .build();

        User mockUser = User.builder()
                .id(1L)
                .keycloakId("keycloak-uuid-123")
                .email("sync@example.com")
                .role(Role.DOCTOR)
                .createdAt(LocalDateTime.now())
                .build();

        when(userSynchronizationService.synchronizeUser("keycloak-uuid-123", "sync@example.com", "DOCTOR"))
                .thenReturn(mockUser);

        // When & Then
        mockMvc.perform(post("/api/users/sync")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(syncRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.keycloakId").value("keycloak-uuid-123"))
                .andExpect(jsonPath("$.email").value("sync@example.com"))
                .andExpect(jsonPath("$.role").value("DOCTOR"));
    }

    @Test
    void testSynchronizeUser_MissingKeycloakId_Returns400BadRequest() throws Exception {
        // Given
        UserSyncRequest syncRequest = UserSyncRequest.builder()
                .email("sync@example.com")
                .role("DOCTOR")
                .build();

        // When & Then
        mockMvc.perform(post("/api/users/sync")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(syncRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSynchronizeUser_InvalidEmail_Returns400BadRequest() throws Exception {
        // Given
        UserSyncRequest syncRequest = UserSyncRequest.builder()
                .keycloakId("keycloak-uuid-123")
                .email("invalid-email")
                .role("DOCTOR")
                .build();

        // When & Then
        mockMvc.perform(post("/api/users/sync")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(syncRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSynchronizeUser_InvalidRole_Returns400BadRequest() throws Exception {
        // Given
        UserSyncRequest syncRequest = UserSyncRequest.builder()
                .keycloakId("keycloak-uuid-123")
                .email("sync@example.com")
                .role("INVALID_ROLE")
                .build();

        // When & Then
        mockMvc.perform(post("/api/users/sync")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(syncRequest)))
                .andExpect(status().isBadRequest());
    }

    // ========== Query Endpoint Tests ==========

    @Test
    void testGetUserById_UserExists_Returns200OK() throws Exception {
        // Given
        User mockUser = User.builder()
                .id(1L)
                .keycloakId("keycloak-uuid-123")
                .email("test@example.com")
                .role(Role.PATIENT)
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));

        // When & Then
        mockMvc.perform(get("/api/users/1")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.keycloakId").value("keycloak-uuid-123"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.role").value("PATIENT"));
    }

    @Test
    void testGetUserById_UserNotFound_Returns404NotFound() throws Exception {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/users/999")
                        .with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("User not found with id: 999"));
    }

    @Test
    void testGetUserByKeycloakId_UserExists_Returns200OK() throws Exception {
        // Given
        User mockUser = User.builder()
                .id(1L)
                .keycloakId("keycloak-uuid-123")
                .email("test@example.com")
                .role(Role.DOCTOR)
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findByKeycloakId("keycloak-uuid-123")).thenReturn(Optional.of(mockUser));

        // When & Then
        mockMvc.perform(get("/api/users/by-keycloak-id/keycloak-uuid-123")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.keycloakId").value("keycloak-uuid-123"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.role").value("DOCTOR"));
    }

    @Test
    void testGetUserByKeycloakId_UserNotFound_Returns404NotFound() throws Exception {
        // Given
        when(userRepository.findByKeycloakId("non-existent-id")).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/users/by-keycloak-id/non-existent-id")
                        .with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("User not found with keycloakId: non-existent-id"));
    }

    @Test
    void testGetAllUsers_NoFilter_ReturnsAllUsers() throws Exception {
        // Given
        User user1 = User.builder()
                .id(1L)
                .keycloakId("keycloak-uuid-1")
                .email("user1@example.com")
                .role(Role.PATIENT)
                .createdAt(LocalDateTime.now())
                .build();

        User user2 = User.builder()
                .id(2L)
                .keycloakId("keycloak-uuid-2")
                .email("user2@example.com")
                .role(Role.DOCTOR)
                .createdAt(LocalDateTime.now())
                .build();

        List<User> allUsers = Arrays.asList(user1, user2);
        when(userRepository.findAll()).thenReturn(allUsers);

        // When & Then
        mockMvc.perform(get("/api/users")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].role").value("PATIENT"))
                .andExpect(jsonPath("$[1].id").value(2L))
                .andExpect(jsonPath("$[1].role").value("DOCTOR"));
    }

    @Test
    void testGetAllUsers_WithRoleFilter_ReturnsFilteredUsers() throws Exception {
        // Given
        User user1 = User.builder()
                .id(1L)
                .keycloakId("keycloak-uuid-1")
                .email("patient1@example.com")
                .role(Role.PATIENT)
                .createdAt(LocalDateTime.now())
                .build();

        User user2 = User.builder()
                .id(2L)
                .keycloakId("keycloak-uuid-2")
                .email("doctor@example.com")
                .role(Role.DOCTOR)
                .createdAt(LocalDateTime.now())
                .build();

        User user3 = User.builder()
                .id(3L)
                .keycloakId("keycloak-uuid-3")
                .email("patient2@example.com")
                .role(Role.PATIENT)
                .createdAt(LocalDateTime.now())
                .build();

        List<User> allUsers = Arrays.asList(user1, user2, user3);
        when(userRepository.findAll()).thenReturn(allUsers);

        // When & Then
        mockMvc.perform(get("/api/users")
                        .param("role", "PATIENT")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].role").value("PATIENT"))
                .andExpect(jsonPath("$[1].role").value("PATIENT"));
    }

    @Test
    void testGetAllUsers_EmptyDatabase_ReturnsEmptyArray() throws Exception {
        // Given
        when(userRepository.findAll()).thenReturn(Arrays.asList());

        // When & Then
        mockMvc.perform(get("/api/users")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
