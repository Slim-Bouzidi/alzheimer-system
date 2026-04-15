package com.alzheimer.userservice.service;

import com.alzheimer.userservice.entity.Role;
import com.alzheimer.userservice.exception.KeycloakServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.RoleResource;
import org.keycloak.admin.client.resource.RolesResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import jakarta.ws.rs.core.Response;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KeycloakAdminServiceTest {

    @Mock
    private Keycloak keycloak;

    @Mock
    private RealmResource realmResource;

    @Mock
    private UsersResource usersResource;

    @Mock
    private UserResource userResource;

    @Mock
    private RolesResource rolesResource;

    @Mock
    private RoleResource roleResource;

    @Mock
    private Response response;

    private KeycloakAdminService keycloakAdminService;

    private static final String TEST_REALM = "test-realm";
    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_FIRST_NAME = "John";
    private static final String TEST_LAST_NAME = "Doe";
    private static final String TEST_PASSWORD = "password123";
    private static final String TEST_KEYCLOAK_ID = "test-keycloak-id-123";

    @BeforeEach
    void setUp() {
        keycloakAdminService = new KeycloakAdminService(keycloak, TEST_REALM);
        
        when(keycloak.realm(TEST_REALM)).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
    }

    @Test
    void createKeycloakUser_Success() {
        // Arrange
        when(usersResource.create(any(UserRepresentation.class))).thenReturn(response);
        when(response.getStatus()).thenReturn(201);
        when(response.getHeaderString("Location")).thenReturn("http://localhost:8081/admin/realms/test-realm/users/" + TEST_KEYCLOAK_ID);

        // Act
        String keycloakId = keycloakAdminService.createKeycloakUser(TEST_EMAIL, TEST_FIRST_NAME, TEST_LAST_NAME);

        // Assert
        assertEquals(TEST_KEYCLOAK_ID, keycloakId);
        
        ArgumentCaptor<UserRepresentation> userCaptor = ArgumentCaptor.forClass(UserRepresentation.class);
        verify(usersResource).create(userCaptor.capture());
        
        UserRepresentation capturedUser = userCaptor.getValue();
        assertEquals(TEST_EMAIL, capturedUser.getUsername());
        assertEquals(TEST_EMAIL, capturedUser.getEmail());
        assertEquals(TEST_FIRST_NAME, capturedUser.getFirstName());
        assertEquals(TEST_LAST_NAME, capturedUser.getLastName());
        assertTrue(capturedUser.isEnabled());
        assertTrue(capturedUser.isEmailVerified());
    }

    @Test
    void createKeycloakUser_DuplicateEmail() {
        // Arrange
        when(usersResource.create(any(UserRepresentation.class))).thenReturn(response);
        when(response.getStatus()).thenReturn(409);

        // Act & Assert
        KeycloakServiceException exception = assertThrows(KeycloakServiceException.class, () -> {
            keycloakAdminService.createKeycloakUser(TEST_EMAIL, TEST_FIRST_NAME, TEST_LAST_NAME);
        });
        
        assertTrue(exception.getMessage().contains("already exists"));
    }

    @Test
    void createKeycloakUser_ServiceUnavailable() {
        // Arrange
        when(usersResource.create(any(UserRepresentation.class))).thenReturn(response);
        when(response.getStatus()).thenReturn(503);

        // Act & Assert
        KeycloakServiceException exception = assertThrows(KeycloakServiceException.class, () -> {
            keycloakAdminService.createKeycloakUser(TEST_EMAIL, TEST_FIRST_NAME, TEST_LAST_NAME);
        });
        
        assertEquals("Authentication service temporarily unavailable", exception.getMessage());
    }

    @Test
    void createKeycloakUser_MissingLocationHeader() {
        // Arrange
        when(usersResource.create(any(UserRepresentation.class))).thenReturn(response);
        when(response.getStatus()).thenReturn(201);
        when(response.getHeaderString("Location")).thenReturn(null);

        // Act & Assert
        KeycloakServiceException exception = assertThrows(KeycloakServiceException.class, () -> {
            keycloakAdminService.createKeycloakUser(TEST_EMAIL, TEST_FIRST_NAME, TEST_LAST_NAME);
        });
        
        assertTrue(exception.getMessage().contains("Failed to extract user ID"));
    }

    @Test
    void setPassword_Success() {
        // Arrange
        when(usersResource.get(TEST_KEYCLOAK_ID)).thenReturn(userResource);

        // Act
        keycloakAdminService.setPassword(TEST_KEYCLOAK_ID, TEST_PASSWORD);

        // Assert
        ArgumentCaptor<CredentialRepresentation> credentialCaptor = ArgumentCaptor.forClass(CredentialRepresentation.class);
        verify(userResource).resetPassword(credentialCaptor.capture());
        
        CredentialRepresentation capturedCredential = credentialCaptor.getValue();
        assertEquals(CredentialRepresentation.PASSWORD, capturedCredential.getType());
        assertEquals(TEST_PASSWORD, capturedCredential.getValue());
        assertFalse(capturedCredential.isTemporary());
    }

    @Test
    void setPassword_ServiceUnavailable() {
        // Arrange
        when(usersResource.get(TEST_KEYCLOAK_ID)).thenReturn(userResource);
        doThrow(new RuntimeException("503 Service Unavailable")).when(userResource).resetPassword(any());

        // Act & Assert
        KeycloakServiceException exception = assertThrows(KeycloakServiceException.class, () -> {
            keycloakAdminService.setPassword(TEST_KEYCLOAK_ID, TEST_PASSWORD);
        });
        
        assertEquals("Authentication service temporarily unavailable", exception.getMessage());
    }

    @Test
    void assignRealmRole_Success() {
        // Arrange
        RoleRepresentation roleRepresentation = new RoleRepresentation();
        roleRepresentation.setName(Role.PATIENT.name());
        
        when(realmResource.roles()).thenReturn(rolesResource);
        when(usersResource.get(TEST_KEYCLOAK_ID)).thenReturn(userResource);
        when(rolesResource.get(Role.PATIENT.name())).thenReturn(roleResource);
        when(roleResource.toRepresentation()).thenReturn(roleRepresentation);
        when(userResource.roles()).thenReturn(mock(org.keycloak.admin.client.resource.RoleMappingResource.class));
        when(userResource.roles().realmLevel()).thenReturn(mock(org.keycloak.admin.client.resource.RoleScopeResource.class));

        // Act
        keycloakAdminService.assignRealmRole(TEST_KEYCLOAK_ID, Role.PATIENT);

        // Assert
        verify(rolesResource).get(Role.PATIENT.name());
        verify(roleResource).toRepresentation();
    }

    @Test
    void assignRealmRole_ServiceUnavailable() {
        // Arrange
        when(realmResource.roles()).thenReturn(rolesResource);
        when(usersResource.get(TEST_KEYCLOAK_ID)).thenReturn(userResource);
        when(rolesResource.get(anyString())).thenThrow(new RuntimeException("503 Service Unavailable"));

        // Act & Assert
        KeycloakServiceException exception = assertThrows(KeycloakServiceException.class, () -> {
            keycloakAdminService.assignRealmRole(TEST_KEYCLOAK_ID, Role.DOCTOR);
        });
        
        assertEquals("Authentication service temporarily unavailable", exception.getMessage());
    }

    @Test
    void deleteKeycloakUser_Success() {
        // Arrange
        when(usersResource.delete(TEST_KEYCLOAK_ID)).thenReturn(response);
        when(response.getStatus()).thenReturn(204);

        // Act
        keycloakAdminService.deleteKeycloakUser(TEST_KEYCLOAK_ID);

        // Assert
        verify(usersResource).delete(TEST_KEYCLOAK_ID);
    }

    @Test
    void deleteKeycloakUser_ServiceUnavailable() {
        // Arrange
        when(usersResource.delete(TEST_KEYCLOAK_ID)).thenReturn(response);
        when(response.getStatus()).thenReturn(503);

        // Act & Assert
        KeycloakServiceException exception = assertThrows(KeycloakServiceException.class, () -> {
            keycloakAdminService.deleteKeycloakUser(TEST_KEYCLOAK_ID);
        });
        
        assertEquals("Authentication service temporarily unavailable", exception.getMessage());
    }

    @Test
    void deleteKeycloakUser_Failure() {
        // Arrange
        when(usersResource.delete(TEST_KEYCLOAK_ID)).thenReturn(response);
        when(response.getStatus()).thenReturn(500);

        // Act & Assert
        KeycloakServiceException exception = assertThrows(KeycloakServiceException.class, () -> {
            keycloakAdminService.deleteKeycloakUser(TEST_KEYCLOAK_ID);
        });
        
        assertTrue(exception.getMessage().contains("Failed to delete Keycloak user"));
    }
}
