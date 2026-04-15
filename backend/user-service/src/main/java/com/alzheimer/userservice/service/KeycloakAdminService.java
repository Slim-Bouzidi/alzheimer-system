package com.alzheimer.userservice.service;

import com.alzheimer.userservice.entity.Role;
import com.alzheimer.userservice.exception.KeycloakServiceException;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.ws.rs.core.Response;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class KeycloakAdminService {

    private final Keycloak keycloak;
    private final String realm;

    @Autowired
    public KeycloakAdminService(Keycloak keycloak, @Value("${keycloak.admin.realm}") String realm) {
        this.keycloak = keycloak;
        this.realm = realm;
    }

    /**
     * Creates a new user in Keycloak
     * 
     * @param email User's email address (used as username)
     * @param firstName User's first name
     * @param lastName User's last name
     * @return Keycloak user ID (UUID)
     * @throws KeycloakServiceException if user creation fails
     */
    public String createKeycloakUser(String email, String firstName, String lastName) {
        log.debug("Creating Keycloak user with email: {}", email);
        
        try {
            UserRepresentation user = new UserRepresentation();
            user.setUsername(email);
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEnabled(true);
            user.setEmailVerified(true);

            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();
            
            Response response = usersResource.create(user);
            
            if (response.getStatus() == 201) {
                String locationHeader = response.getHeaderString("Location");
                if (locationHeader == null) {
                    throw new KeycloakServiceException("Failed to extract user ID from Keycloak response");
                }
                
                String keycloakId = locationHeader.substring(locationHeader.lastIndexOf('/') + 1);
                log.info("Successfully created Keycloak user with ID: {}", keycloakId);
                return keycloakId;
            } else if (response.getStatus() == 409) {
                throw new KeycloakServiceException("User with email " + email + " already exists in Keycloak");
            } else if (response.getStatus() == 503) {
                throw new KeycloakServiceException("Authentication service temporarily unavailable");
            } else {
                String errorMessage = response.readEntity(String.class);
                throw new KeycloakServiceException("Failed to create Keycloak user. Status: " + 
                    response.getStatus() + ", Message: " + errorMessage);
            }
        } catch (KeycloakServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating Keycloak user", e);
            throw new KeycloakServiceException("Failed to create Keycloak user: " + e.getMessage(), e);
        }
    }

    /**
     * Sets the password for a Keycloak user
     * 
     * @param keycloakId Keycloak user ID
     * @param password User's password
     * @throws KeycloakServiceException if password setting fails
     */
    public void setPassword(String keycloakId, String password) {
        log.debug("Setting password for Keycloak user: {}", keycloakId);
        
        try {
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(password);
            credential.setTemporary(false);

            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(keycloakId);
            userResource.resetPassword(credential);
            
            log.info("Successfully set password for Keycloak user: {}", keycloakId);
        } catch (Exception e) {
            log.error("Error setting password for Keycloak user: {}", keycloakId, e);
            if (e.getMessage() != null && e.getMessage().contains("503")) {
                throw new KeycloakServiceException("Authentication service temporarily unavailable", e);
            }
            throw new KeycloakServiceException("Failed to set password for Keycloak user: " + e.getMessage(), e);
        }
    }

    /**
     * Assigns a realm role to a Keycloak user
     * 
     * @param keycloakId Keycloak user ID
     * @param role Application role to assign
     * @throws KeycloakServiceException if role assignment fails
     */
    public void assignRealmRole(String keycloakId, Role role) {
        log.debug("Assigning role {} to Keycloak user: {}", role, keycloakId);
        
        try {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(keycloakId);
            
            // Get the role representation from Keycloak
            RoleRepresentation roleRepresentation = realmResource.roles()
                .get(role.name())
                .toRepresentation();
            
            // Assign the role to the user
            userResource.roles().realmLevel().add(Collections.singletonList(roleRepresentation));
            
            log.info("Successfully assigned role {} to Keycloak user: {}", role, keycloakId);
        } catch (Exception e) {
            log.error("Error assigning role {} to Keycloak user: {}", role, keycloakId, e);
            if (e.getMessage() != null && e.getMessage().contains("503")) {
                throw new KeycloakServiceException("Authentication service temporarily unavailable", e);
            }
            throw new KeycloakServiceException("Failed to assign role to Keycloak user: " + e.getMessage(), e);
        }
    }

    /**
     * Deletes a user from Keycloak (used for rollback scenarios)
     * 
     * @param keycloakId Keycloak user ID
     * @throws KeycloakServiceException if user deletion fails
     */
    public void deleteKeycloakUser(String keycloakId) {
        log.debug("Deleting Keycloak user: {}", keycloakId);
        
        try {
            RealmResource realmResource = keycloak.realm(realm);
            Response response = realmResource.users().delete(keycloakId);
            
            if (response.getStatus() == 204) {
                log.info("Successfully deleted Keycloak user: {}", keycloakId);
            } else if (response.getStatus() == 503) {
                throw new KeycloakServiceException("Authentication service temporarily unavailable");
            } else {
                log.warn("Failed to delete Keycloak user: {}. Status: {}", keycloakId, response.getStatus());
                throw new KeycloakServiceException("Failed to delete Keycloak user. Status: " + response.getStatus());
            }
        } catch (KeycloakServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting Keycloak user: {}", keycloakId, e);
            if (e.getMessage() != null && e.getMessage().contains("503")) {
                throw new KeycloakServiceException("Authentication service temporarily unavailable", e);
            }
            throw new KeycloakServiceException("Failed to delete Keycloak user: " + e.getMessage(), e);
        }
    }
}
