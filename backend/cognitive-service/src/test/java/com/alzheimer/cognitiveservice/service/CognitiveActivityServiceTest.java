package com.alzheimer.cognitiveservice.service;

import com.alzheimer.cognitiveservice.client.PatientDTO;
import com.alzheimer.cognitiveservice.client.PatientServiceClient;
import com.alzheimer.cognitiveservice.config.RabbitMQConfig;
import com.alzheimer.cognitiveservice.dto.ActivityRequest;
import com.alzheimer.cognitiveservice.dto.ActivityResponse;
import com.alzheimer.cognitiveservice.entity.CognitiveActivity;
import com.alzheimer.cognitiveservice.repository.CognitiveActivityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
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
    private PatientServiceClient patientServiceClient;

    @InjectMocks
    private CognitiveActivityService service;

    private CognitiveActivity savedActivity;
    private ActivityRequest request;

    @BeforeEach
    void setUp() {
        request = ActivityRequest.builder()
                .patientId("1")
                .gameType("memory")
                .score(85)
                .durationMs(12000L)
                .build();

        savedActivity = CognitiveActivity.builder()
                .id(1L)
                .patientId("1")
                .gameType("memory")
                .score(85)
                .durationMs(12000L)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // helper — returns a mock patient from patient-service
    private void mockPatientExists() {
        PatientDTO mockPatient = new PatientDTO();
        mockPatient.setIdPatient(1);
        mockPatient.setFirstName("Marie");
        mockPatient.setLastName("Dupont");
        when(patientServiceClient.getPatientById(1)).thenReturn(mockPatient);
    }

    // ── saveActivity ──────────────────────────────────────────────

    @Test
    void saveActivity_shouldPersistAndReturnResponse() {
        mockPatientExists();
        when(repository.save(any(CognitiveActivity.class))).thenReturn(savedActivity);

        ActivityResponse response = service.saveActivity(request);

        assertThat(response.getPatientId()).isEqualTo("1");
        assertThat(response.getGameType()).isEqualTo("memory");
        assertThat(response.getScore()).isEqualTo(85);
        assertThat(response.getDurationMs()).isEqualTo(12000L);
        assertThat(response.getId()).isEqualTo(1L);
        verify(repository, times(1)).save(any(CognitiveActivity.class));
    }

    @Test
    void saveActivity_shouldCallPatientServiceViaOpenFeign() {
        mockPatientExists();
        when(repository.save(any(CognitiveActivity.class))).thenReturn(savedActivity);

        service.saveActivity(request);

        // Verify OpenFeign was called to validate the patient
        verify(patientServiceClient, times(1)).getPatientById(1);
    }

    @Test
    void saveActivity_shouldStillSave_whenPatientServiceIsDown() {
        // Simulate patient-service being unreachable
        when(patientServiceClient.getPatientById(anyInt()))
                .thenThrow(new RuntimeException("patient-service unavailable"));
        when(repository.save(any(CognitiveActivity.class))).thenReturn(savedActivity);

        // Should NOT throw — graceful degradation
        ActivityResponse response = service.saveActivity(request);

        assertThat(response).isNotNull();
        verify(repository, times(1)).save(any(CognitiveActivity.class));
    }

    @Test
    void saveActivity_shouldSetTimestampAutomatically() {
        mockPatientExists();
        when(repository.save(any(CognitiveActivity.class))).thenReturn(savedActivity);

        service.saveActivity(request);

        ArgumentCaptor<CognitiveActivity> captor = ArgumentCaptor.forClass(CognitiveActivity.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getTimestamp()).isNotNull();
    }

    @Test
    void saveActivity_shouldPublishToRabbitMQ() {
        mockPatientExists();
        when(repository.save(any(CognitiveActivity.class))).thenReturn(savedActivity);

        service.saveActivity(request);

        verify(rabbitTemplate, times(1)).convertAndSend(
                eq(RabbitMQConfig.EXCHANGE),
                eq(RabbitMQConfig.ROUTING_KEY),
                any(ActivityResponse.class)
        );
    }

    @Test
    void saveActivity_shouldStillReturnResponse_whenRabbitMQFails() {
        mockPatientExists();
        when(repository.save(any(CognitiveActivity.class))).thenReturn(savedActivity);
        doThrow(new RuntimeException("RabbitMQ down"))
                .when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));

        // Should NOT throw — RabbitMQ failure is caught internally
        ActivityResponse response = service.saveActivity(request);

        assertThat(response).isNotNull();
        assertThat(response.getPatientId()).isEqualTo("1");
    }

    // ── getPatientActivities ──────────────────────────────────────

    @Test
    void getPatientActivities_shouldReturnMappedList() {
        CognitiveActivity second = CognitiveActivity.builder()
                .id(2L).patientId("1").gameType("reflex")
                .score(70).durationMs(8000L).timestamp(LocalDateTime.now()).build();

        when(repository.findByPatientId("1")).thenReturn(List.of(savedActivity, second));

        List<ActivityResponse> result = service.getPatientActivities("1");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getGameType()).isEqualTo("memory");
        assertThat(result.get(1).getGameType()).isEqualTo("reflex");
    }

    @Test
    void getPatientActivities_shouldReturnEmptyList_whenNoActivities() {
        when(repository.findByPatientId("unknown-patient")).thenReturn(List.of());

        List<ActivityResponse> result = service.getPatientActivities("unknown-patient");

        assertThat(result).isEmpty();
    }

    @Test
    void getPatientActivities_shouldMapAllFieldsCorrectly() {
        when(repository.findByPatientId("1")).thenReturn(List.of(savedActivity));

        List<ActivityResponse> result = service.getPatientActivities("1");

        ActivityResponse r = result.get(0);
        assertThat(r.getId()).isEqualTo(1L);
        assertThat(r.getPatientId()).isEqualTo("1");
        assertThat(r.getScore()).isEqualTo(85);
        assertThat(r.getDurationMs()).isEqualTo(12000L);
        assertThat(r.getTimestamp()).isNotNull();
    }

    // ── deleteActivity ────────────────────────────────────────────

    @Test
    void deleteActivity_shouldCallRepositoryDeleteById() {
        doNothing().when(repository).deleteById(1L);

        service.deleteActivity(1L);

        verify(repository, times(1)).deleteById(1L);
    }

    @Test
    void deleteActivity_shouldNotThrow_whenIdExists() {
        doNothing().when(repository).deleteById(anyLong());

        org.junit.jupiter.api.Assertions.assertDoesNotThrow(() -> service.deleteActivity(99L));
    }
}
