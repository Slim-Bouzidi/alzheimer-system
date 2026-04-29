package com.alzheimer.cognitiveservice.service;

import com.alzheimer.cognitiveservice.config.RabbitMQConfig;
import com.alzheimer.cognitiveservice.dto.ActivityRequest;
import com.alzheimer.cognitiveservice.dto.ActivityResponse;
import com.alzheimer.cognitiveservice.dto.TrendAnalysisResponse;
import com.alzheimer.cognitiveservice.entity.CognitiveActivity;
import com.alzheimer.cognitiveservice.repository.CognitiveActivityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CognitiveActivityServiceTest {

    @Mock
    private CognitiveActivityRepository repository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @Mock
    private TrendAnalysisService trendService;

    @Mock
    private AlertService alertService;

    @InjectMocks
    private CognitiveActivityService service;

    private CognitiveActivity savedActivity;
    private ActivityRequest request;
    private TrendAnalysisResponse trendResponse;

    @BeforeEach
    void setUp() {
        request = ActivityRequest.builder()
                .patientId("patient-1")
                .gameType("memory")
                .score(90)
                .durationMs(15000L)
                .build();

        savedActivity = CognitiveActivity.builder()
                .id(100L)
                .patientId("patient-1")
                .gameType("MEMORY")
                .score(90)
                .durationMs(15000L)
                .timestamp(LocalDateTime.now())
                .build();

        trendResponse = TrendAnalysisResponse.builder()
                .patientId("patient-1")
                .gameType("MEMORY")
                .trend("IMPROVING")
                .build();
    }

    // ── saveActivity ──────────────────────────────────────────────

    @Test
    @DisplayName("Save Activity - Success Flow")
    void saveActivity_shouldPersistAndReturnResponse() {
        when(repository.save(any(CognitiveActivity.class))).thenReturn(savedActivity);
        when(trendService.analyzeAndSave(anyString(), anyString(), anyInt())).thenReturn(trendResponse);

        ActivityResponse response = service.saveActivity(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getGameType()).isEqualTo("MEMORY");
        assertThat(response.getPatientId()).isEqualTo("patient-1");

        ArgumentCaptor<CognitiveActivity> captor = ArgumentCaptor.forClass(CognitiveActivity.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getGameType()).isEqualTo("MEMORY");
        
        verify(rabbitTemplate).convertAndSend(eq(RabbitMQConfig.EXCHANGE), eq(RabbitMQConfig.ROUTING_KEY), any(ActivityResponse.class));
        verify(trendService).analyzeAndSave("patient-1", "MEMORY", 14);
        verify(alertService).evaluateAndAlert(trendResponse);
    }

    @Test
    @DisplayName("Save Activity - GameType Case Normalization")
    void saveActivity_shouldNormalizeGameTypeToUpperCase() {
        request.setGameType("Reflex_Game");
        when(repository.save(any())).thenReturn(savedActivity);

        service.saveActivity(request);

        ArgumentCaptor<CognitiveActivity> captor = ArgumentCaptor.forClass(CognitiveActivity.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getGameType()).isEqualTo("REFLEX_GAME");
    }

    @Test
    @DisplayName("Save Activity - Fail when GameType is Null")
    void saveActivity_shouldThrowException_whenGameTypeIsNull() {
        request.setGameType(null);

        assertThatThrownBy(() -> service.saveActivity(request))
                .isInstanceOf(NullPointerException.class);

        verifyNoInteractions(repository, rabbitTemplate, trendService, alertService);
    }

    @Test
    @DisplayName("Save Activity - Handle RabbitMQ failure gracefully")
    void saveActivity_shouldNotFail_whenRabbitMQFails() {
        when(repository.save(any())).thenReturn(savedActivity);
        doThrow(new RuntimeException("RabbitMQ Connection Refused"))
                .when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));

        ActivityResponse response = service.saveActivity(request);

        assertThat(response).isNotNull();
        verify(repository).save(any());
        verify(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));
        // Should still proceed to analysis
        verify(trendService).analyzeAndSave(anyString(), anyString(), anyInt());
    }

    @Test
    @DisplayName("Save Activity - Handle Analysis failure gracefully")
    void saveActivity_shouldNotFail_whenAnalysisServiceFails() {
        when(repository.save(any())).thenReturn(savedActivity);
        when(trendService.analyzeAndSave(anyString(), anyString(), anyInt()))
                .thenThrow(new RuntimeException("Trend service timeout"));

        ActivityResponse response = service.saveActivity(request);

        assertThat(response).isNotNull();
        verify(trendService).analyzeAndSave(anyString(), anyString(), anyInt());
        verify(alertService, never()).evaluateAndAlert(any());
    }

    @Test
    @DisplayName("Save Activity - Skip analysis when services are null")
    void saveActivity_shouldSkipAnalysis_whenServicesAreMissing() {
        // Create service manually without some mocks to test null check branches
        CognitiveActivityService partialService = new CognitiveActivityService(repository, rabbitTemplate, null, null, null);
        
        when(repository.save(any())).thenReturn(savedActivity);

        ActivityResponse response = partialService.saveActivity(request);

        assertThat(response).isNotNull();
        verify(repository).save(any());
        // Verify no calls to analysis (mocks would be null anyway, but this tests the 'if' branch)
    }

    // ── getPatientActivities ──────────────────────────────────────

    @Test
    @DisplayName("Get Patient Activities - Success")
    void getPatientActivities_shouldReturnMappedList() {
        CognitiveActivity activity2 = CognitiveActivity.builder().id(101L).patientId("patient-1").gameType("RECALL").build();
        when(repository.findByPatientId("patient-1")).thenReturn(List.of(savedActivity, activity2));

        List<ActivityResponse> result = service.getPatientActivities("patient-1");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(100L);
        assertThat(result.get(1).getId()).isEqualTo(101L);
        verify(repository).findByPatientId("patient-1");
    }

    @Test
    @DisplayName("Get Patient Activities - Empty Result")
    void getPatientActivities_shouldReturnEmptyList_whenNotFound() {
        when(repository.findByPatientId("unknown")).thenReturn(Collections.emptyList());

        List<ActivityResponse> result = service.getPatientActivities("unknown");

        assertThat(result).isEmpty();
        verify(repository).findByPatientId("unknown");
    }

    // ── deleteActivity ────────────────────────────────────────────

    @Test
    @DisplayName("Delete Activity - Success")
    void deleteActivity_shouldInvokeRepositoryDelete() {
        service.deleteActivity(99L);

        verify(repository, times(1)).deleteById(99L);
    }
}
