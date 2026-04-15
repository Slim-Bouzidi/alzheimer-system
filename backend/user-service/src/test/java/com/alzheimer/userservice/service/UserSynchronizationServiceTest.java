package com.alzheimer.userservice.service;

import com.alzheimer.userservice.entity.Role;
import com.alzheimer.userservice.entity.User;
import com.alzheimer.userservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserSynchronizationServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserSynchronizationService userSynchronizationService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .id(1L)
            .keycloakId("test-keycloak-id")
            .email("test@example.com")
            .role(Role.PATIENT)
            .createdAt(LocalDateTime.now())
            .build();
    }

    @Test
    void synchronizeUser_ExistingUser_ReturnsExistingUser() {
        // Given
        when(userRepository.findByKeycloakId("test-keycloak-id"))
            .thenReturn(Optional.of(testUser));

        // When
        User result = userSynchronizationService.synchronizeUser(
            "test-keycloak-id",
            "test@example.com",
            "PATIENT"
        );

        // Then
        assertNotNull(result);
        assertEquals(testUser.getId(), result.getId());
        assertEquals(testUser.getKeycloakId(), result.getKeycloakId());
        verify(userRepository, times(1)).findByKeycloakId("test-keycloak-id");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void synchronizeUser_NewUser_CreatesAndReturnsUser() {
        // Given
        when(userRepository.findByKeycloakId("new-keycloak-id"))
            .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class)))
            .thenReturn(testUser);

        // When
        User result = userSynchronizationService.synchronizeUser(
            "new-keycloak-id",
            "new@example.com",
            "DOCTOR"
        );

        // Then
        assertNotNull(result);
        verify(userRepository, times(1)).findByKeycloakId("new-keycloak-id");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void synchronizeUser_NullEmail_UsesDefaultEmail() {
        // Given
        when(userRepository.findByKeycloakId("test-keycloak-id"))
            .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class)))
            .thenAnswer(invocation -> {
                User savedUser = invocation.getArgument(0);
                assertEquals("test-keycloak-id@default.local", savedUser.getEmail());
                return savedUser;
            });

        // When
        userSynchronizationService.synchronizeUser(
            "test-keycloak-id",
            null,
            "PATIENT"
        );

        // Then
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void synchronizeUser_NullRole_UsesDefaultRole() {
        // Given
        when(userRepository.findByKeycloakId("test-keycloak-id"))
            .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class)))
            .thenAnswer(invocation -> {
                User savedUser = invocation.getArgument(0);
                assertEquals(Role.PATIENT, savedUser.getRole());
                return savedUser;
            });

        // When
        userSynchronizationService.synchronizeUser(
            "test-keycloak-id",
            "test@example.com",
            null
        );

        // Then
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void synchronizeUser_ConcurrentCreation_HandlesConstraintViolation() {
        // Given
        when(userRepository.findByKeycloakId("test-keycloak-id"))
            .thenReturn(Optional.empty())
            .thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class)))
            .thenThrow(new DataIntegrityViolationException("Duplicate key"));

        // When
        User result = userSynchronizationService.synchronizeUser(
            "test-keycloak-id",
            "test@example.com",
            "PATIENT"
        );

        // Then
        assertNotNull(result);
        assertEquals(testUser.getId(), result.getId());
        verify(userRepository, times(2)).findByKeycloakId("test-keycloak-id");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void synchronizeUser_ConcurrentCreationAndNotFound_ThrowsException() {
        // Given
        when(userRepository.findByKeycloakId("test-keycloak-id"))
            .thenReturn(Optional.empty())
            .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class)))
            .thenThrow(new DataIntegrityViolationException("Duplicate key"));

        // When/Then
        assertThrows(RuntimeException.class, () -> {
            userSynchronizationService.synchronizeUser(
                "test-keycloak-id",
                "test@example.com",
                "PATIENT"
            );
        });
    }
}
