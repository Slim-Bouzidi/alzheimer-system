package com.alzheimer.userservice.service;

import com.alzheimer.userservice.dto.UserRegistrationRequest;
import com.alzheimer.userservice.dto.UserResponse;
import com.alzheimer.userservice.entity.Role;
import com.alzheimer.userservice.entity.User;
import com.alzheimer.userservice.exception.KeycloakServiceException;
import com.alzheimer.userservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserRegistrationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private KeycloakAdminService keycloakAdminService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private UserRegistrationService userRegistrationService;

    private UserRegistrationRequest validRequest;
    private User mockUser;

    @BeforeEach
    void setUp() {
        validRequest = UserRegistrationRequest.builder()
                .email("test@example.com")
                .password("Password123!")
                .firstName("John")
                .lastName("Doe")
                .role(Role.PATIENT)
                .build();

        mockUser = User.builder()
                .id(1L)
                .keycloakId("keycloak-uuid-123")
                .email("test@example.com")
                .role(Role.PATIENT)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void testRegisterUser_ValidRequest_CreatesUserSuccessfully() {
        // Given
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(keycloakAdminService.createKeycloakUser(anyString(), anyString(), anyString()))
                .thenReturn("keycloak-uuid-123");
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        // When
        UserResponse response = userRegistrationService.registerUser(validRequest);

        // Then
        assertNotNull(response);
        assertEquals(mockUser.getId(), response.getId());
        assertEquals(mockUser.getKeycloakId(), response.getKeycloakId());
        assertEquals(mockUser.getEmail(), response.getEmail());
        assertEquals(mockUser.getRole(), response.getRole());

        verify(keycloakAdminService).createKeycloakUser("test@example.com", "John", "Doe");
        verify(keycloakAdminService).setPassword("keycloak-uuid-123", "Password123!");
        verify(keycloakAdminService).assignRealmRole("keycloak-uuid-123", Role.PATIENT);
        verify(userRepository).save(any(User.class));
        verify(restTemplate).postForEntity(anyString(), any(), eq(Object.class));
    }

    @Test
    void testRegisterUser_DuplicateEmail_ThrowsException() {
        // Given
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            userRegistrationService.registerUser(validRequest);
        });

        assertEquals("Email already registered", exception.getMessage());
        verify(keycloakAdminService, never()).createKeycloakUser(anyString(), anyString(), anyString());
    }

    @Test
    void testRegisterUser_InvalidEmail_ThrowsException() {
        // Given
        validRequest.setEmail("invalid-email");

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            userRegistrationService.registerUser(validRequest);
        });

        assertEquals("Invalid email format", exception.getMessage());
    }

    @Test
    void testRegisterUser_NullRole_ThrowsException() {
        // Given
        validRequest.setRole(null);

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            userRegistrationService.registerUser(validRequest);
        });

        assertTrue(exception.getMessage().contains("Invalid role"));
    }

    @Test
    void testRegisterUser_KeycloakFailure_RollsBack() {
        // Given
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(keycloakAdminService.createKeycloakUser(anyString(), anyString(), anyString()))
                .thenThrow(new KeycloakServiceException("Keycloak error"));

        // When & Then
        assertThrows(KeycloakServiceException.class, () -> {
            userRegistrationService.registerUser(validRequest);
        });

        // Verify no rollback needed since creation failed
        verify(keycloakAdminService, never()).deleteKeycloakUser(anyString());
    }

    @Test
    void testRegisterUser_DatabaseFailure_RollsBackKeycloakUser() {
        // Given
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(keycloakAdminService.createKeycloakUser(anyString(), anyString(), anyString()))
                .thenReturn("keycloak-uuid-123");
        when(userRepository.save(any(User.class)))
                .thenThrow(new RuntimeException("Database error"));

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            userRegistrationService.registerUser(validRequest);
        });

        verify(keycloakAdminService).deleteKeycloakUser("keycloak-uuid-123");
    }

    @Test
    void testRegisterUser_PatientServiceUnavailable_ReturnsSuccess() {
        // Given
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(keycloakAdminService.createKeycloakUser(anyString(), anyString(), anyString()))
                .thenReturn("keycloak-uuid-123");
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        when(restTemplate.postForEntity(anyString(), any(), eq(Object.class)))
                .thenThrow(new RestClientException("Patient Service unavailable"));

        // When
        UserResponse response = userRegistrationService.registerUser(validRequest);

        // Then
        assertNotNull(response);
        assertEquals(mockUser.getId(), response.getId());
        // User creation should succeed even if patient creation fails
    }

    @Test
    void testRegisterUser_DoctorRole_DoesNotCreatePatient() {
        // Given
        validRequest.setRole(Role.DOCTOR);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(keycloakAdminService.createKeycloakUser(anyString(), anyString(), anyString()))
                .thenReturn("keycloak-uuid-123");
        
        User doctorUser = User.builder()
                .id(1L)
                .keycloakId("keycloak-uuid-123")
                .email("test@example.com")
                .role(Role.DOCTOR)
                .createdAt(LocalDateTime.now())
                .build();
        when(userRepository.save(any(User.class))).thenReturn(doctorUser);

        // When
        UserResponse response = userRegistrationService.registerUser(validRequest);

        // Then
        assertNotNull(response);
        assertEquals(Role.DOCTOR, response.getRole());
        verify(restTemplate, never()).postForEntity(anyString(), any(), any());
    }

    @Test
    void testValidateRegistrationRequest_ValidRequest_Passes() {
        // Given
        when(userRepository.existsByEmail(anyString())).thenReturn(false);

        // When & Then
        assertDoesNotThrow(() -> {
            userRegistrationService.validateRegistrationRequest(validRequest);
        });
    }

    @Test
    void testValidateRegistrationRequest_EmailWithoutAt_Fails() {
        // Given
        validRequest.setEmail("invalidemail.com");

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            userRegistrationService.validateRegistrationRequest(validRequest);
        });

        assertEquals("Invalid email format", exception.getMessage());
    }

    @Test
    void testCreateKeycloakUser_Success_ReturnsKeycloakId() {
        // Given
        when(keycloakAdminService.createKeycloakUser(anyString(), anyString(), anyString()))
                .thenReturn("keycloak-uuid-123");

        // When
        String keycloakId = userRegistrationService.createKeycloakUser(validRequest);

        // Then
        assertEquals("keycloak-uuid-123", keycloakId);
        verify(keycloakAdminService).setPassword("keycloak-uuid-123", "Password123!");
        verify(keycloakAdminService).assignRealmRole("keycloak-uuid-123", Role.PATIENT);
    }

    @Test
    void testCreateUserRecord_Success_ReturnsUser() {
        // Given
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        // When
        User user = userRegistrationService.createUserRecord("keycloak-uuid-123", validRequest);

        // Then
        assertNotNull(user);
        assertEquals(mockUser.getId(), user.getId());
        assertEquals(mockUser.getKeycloakId(), user.getKeycloakId());
        verify(userRepository).save(any(User.class));
    }
}
