package com.alzheimer.cognitiveservice.controller;

import com.alzheimer.cognitiveservice.dto.ActivityRequest;
import com.alzheimer.cognitiveservice.dto.ActivityResponse;
import com.alzheimer.cognitiveservice.service.CognitiveActivityService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
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

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        sampleResponse = ActivityResponse.builder()
                .id(1L)
                .patientId("patient-123")
                .gameType("memory")
                .score(85)
                .durationMs(12000L)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ── POST /api/cognitive-activities ───────────────────────────

    @Test
    void save_shouldReturn200WithResponse() throws Exception {
        ActivityRequest request = ActivityRequest.builder()
                .patientId("patient-123")
                .gameType("memory")
                .score(85)
                .durationMs(12000L)
                .build();

        when(service.saveActivity(any(ActivityRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/cognitive-activities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId").value("patient-123"))
                .andExpect(jsonPath("$.gameType").value("memory"))
                .andExpect(jsonPath("$.score").value(85))
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void save_shouldCallServiceOnce() throws Exception {
        ActivityRequest request = ActivityRequest.builder()
                .patientId("patient-123").gameType("reflex").score(60).durationMs(5000L).build();

        when(service.saveActivity(any())).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/cognitive-activities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(service, times(1)).saveActivity(any(ActivityRequest.class));
    }

    // ── GET /api/cognitive-activities/patient/{patientId} ────────

    @Test
    void getPatientActivities_shouldReturn200WithList() throws Exception {
        ActivityResponse second = ActivityResponse.builder()
                .id(2L).patientId("patient-123").gameType("reflex")
                .score(70).durationMs(8000L).timestamp(LocalDateTime.now()).build();

        when(service.getPatientActivities("patient-123")).thenReturn(List.of(sampleResponse, second));

        mockMvc.perform(get("/api/cognitive-activities/patient/patient-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].gameType").value("memory"))
                .andExpect(jsonPath("$[1].gameType").value("reflex"));
    }

    @Test
    void getPatientActivities_shouldReturnEmptyList_whenNoActivities() throws Exception {
        when(service.getPatientActivities("unknown")).thenReturn(List.of());

        mockMvc.perform(get("/api/cognitive-activities/patient/unknown"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ── DELETE /api/cognitive-activities/{id} ────────────────────

    @Test
    void delete_shouldReturn204NoContent() throws Exception {
        doNothing().when(service).deleteActivity(1L);

        mockMvc.perform(delete("/api/cognitive-activities/1"))
                .andExpect(status().isNoContent());

        verify(service, times(1)).deleteActivity(1L);
    }

    @Test
    void delete_shouldCallServiceWithCorrectId() throws Exception {
        doNothing().when(service).deleteActivity(eq(42L));

        mockMvc.perform(delete("/api/cognitive-activities/42"))
                .andExpect(status().isNoContent());

        verify(service).deleteActivity(42L);
    }
}
