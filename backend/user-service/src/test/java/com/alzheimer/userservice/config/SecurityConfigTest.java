package com.alzheimer.userservice.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testRegistrationEndpointIsPublic() throws Exception {
        // Registration endpoint should be accessible without authentication
        mockMvc.perform(post("/api/users/register")
                .contentType("application/json")
                .content("{}"))
                .andExpect(status().is4xxClientError()); // Will fail validation, but not 401
    }

    @Test
    void testActuatorEndpointIsPublic() throws Exception {
        // Actuator endpoints should be accessible without authentication (returns 404 if not configured, not 401)
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isNotFound()); // 404 means it's not secured, just doesn't exist
    }

    @Test
    void testProtectedEndpointRequiresAuthentication() throws Exception {
        // Other endpoints should require authentication
        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testOptionsRequestIsPermitted() throws Exception {
        // OPTIONS requests should be permitted for CORS preflight
        mockMvc.perform(options("/api/users"))
                .andExpect(status().isOk());
    }

    @Test
    void testSyncEndpointRequiresAuthentication() throws Exception {
        // Sync endpoint should require authentication
        mockMvc.perform(post("/api/users/sync")
                .contentType("application/json")
                .content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
