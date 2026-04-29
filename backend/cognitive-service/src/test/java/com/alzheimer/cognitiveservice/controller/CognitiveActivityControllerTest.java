package com.alzheimer.cognitiveservice.controller;

import com.alzheimer.cognitiveservice.dto.ActivityRequest;
import com.alzheimer.cognitiveservice.dto.ActivityResponse;
import com.alzheimer.cognitiveservice.service.CognitiveActivityService;
import com.alzheimer.cognitiveservice.exception.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CognitiveActivityControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private CognitiveActivityService service;

    @InjectMocks
    private CognitiveActivityController controller;

    private ActivityResponse sampleResponse;
    private ActivityRequest validRequest;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        validRequest = ActivityRequest.builder()
                .patientId("patient-123")
                .gameType("memory")
                .score(85)
                .durationMs(12000L)
                .build();

        sampleResponse = ActivityResponse.builder()
                .id(1L)
                .patientId("patient-123")
                .gameType("MEMORY")
                .score(85)
                .durationMs(12000L)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ── POST /api/cognitive-activities ───────────────────────────

    @Test
    @DisplayName("POST / - Success")
    void save_shouldReturn200AndSavedActivity() throws Exception {
        when(service.saveActivity(any(ActivityRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/cognitive-activities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.patientId").value("patient-123"))
                .andExpect(jsonPath("$.gameType").value("MEMORY"))
                .andExpect(jsonPath("$.score").value(85))
                .andExpect(jsonPath("$.durationMs").value(12000))
                .andExpect(jsonPath("$.timestamp").exists());

        verify(service, times(1)).saveActivity(any());
    }

    @Test
    @DisplayName("POST / - Handle Service Exception")
    void save_shouldReturn500_whenServiceFails() throws Exception {
        when(service.saveActivity(any())).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(post("/api/cognitive-activities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isInternalServerError());
    }

    // ── GET /api/cognitive-activities/patient/{patientId} ────────

    @Test
    @DisplayName("GET /patient/{id} - Success List")
    void getPatientActivities_shouldReturnList() throws Exception {
        when(service.getPatientActivities("patient-123")).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/cognitive-activities/patient/patient-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].patientId").value("patient-123"));
    }

    @Test
    @DisplayName("GET /patient/{id} - Empty List")
    void getPatientActivities_shouldReturnEmptyList_whenNoData() throws Exception {
        when(service.getPatientActivities("unknown")).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/cognitive-activities/patient/unknown"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ── DELETE /api/cognitive-activities/{id} ────────────────────

    @Test
    @DisplayName("DELETE /{id} - Success")
    void delete_shouldReturn204() throws Exception {
        doNothing().when(service).deleteActivity(1L);

        mockMvc.perform(delete("/api/cognitive-activities/1"))
                .andExpect(status().isNoContent());

        verify(service).deleteActivity(1L);
    }

    @Test
    @DisplayName("DELETE /{id} - Invalid ID Format")
    void delete_shouldReturn400_whenIdIsNotLong() throws Exception {
        // MockMvc will handle type mismatch for @PathVariable Long
        mockMvc.perform(delete("/api/cognitive-activities/abc"))
                .andExpect(status().isBadRequest());
        
        verifyNoInteractions(service);
    }

    @Test
    @DisplayName("DELETE /{id} - Service Failure")
    void delete_shouldReturn500_whenServiceThrows() throws Exception {
        doThrow(new RuntimeException("Unexpected error")).when(service).deleteActivity(anyLong());

        mockMvc.perform(delete("/api/cognitive-activities/999"))
                .andExpect(status().isInternalServerError());
    }
}
