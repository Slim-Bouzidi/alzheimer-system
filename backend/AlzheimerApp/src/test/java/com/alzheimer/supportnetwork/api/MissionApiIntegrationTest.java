package com.alzheimer.supportnetwork.api;

import com.alzheimer.supportnetwork.entity.Patient;
import com.alzheimer.supportnetwork.entity.SupportMember;
import com.alzheimer.supportnetwork.repository.NotificationRepository;
import com.alzheimer.supportnetwork.repository.PatientRepository;
import com.alzheimer.supportnetwork.repository.SupportMemberRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.alzheimer.supportnetwork.dto.mail.EmailSendOutcome;
import com.alzheimer.supportnetwork.service.EmailNotificationService;
import com.alzheimer.supportnetwork.service.EscalationSchedulerService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Mission API — integration flow")
class MissionApiIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private PatientRepository patientRepository;
    @Autowired private SupportMemberRepository supportMemberRepository;
    @Autowired private NotificationRepository notificationRepository;

    @MockBean private EmailNotificationService emailNotificationService;
    @MockBean private EscalationSchedulerService escalationSchedulerService;

    private Long memberId;

    @BeforeEach
    void seedData() {
        when(emailNotificationService.sendMissionAssignedEmail(
                        nullable(String.class), any(), nullable(String.class), nullable(String.class)))
                .thenReturn(EmailSendOutcome.success(201, "integration-test"));
        when(emailNotificationService.sendMissionAssignedEmail(anyString(), any()))
                .thenReturn(EmailSendOutcome.success(201, "integration-test"));
        when(emailNotificationService.sendMissionAssignedEmail(anyString(), any(), anyString()))
                .thenReturn(EmailSendOutcome.success(201, "integration-test"));
        when(emailNotificationService.sendEscalationEmail(any(), any()))
                .thenReturn(EmailSendOutcome.success(201, "integration-test"));
        when(emailNotificationService.sendAlertTriggeredEmail(any(), anyLong(), any()))
                .thenReturn(EmailSendOutcome.success(201, "integration-test"));
        Patient p = Patient.builder().id(501L).fullName("Integration Patient").zone("Z").build();
        patientRepository.save(p);
        SupportMember m =
                supportMemberRepository.save(
                        SupportMember.builder()
                                .fullName("Member One")
                                .email("member1@test.local")
                                .type("FAMILY")
                                .locationZone("Z")
                                .build());
        memberId = m.getId();
    }

    @Test
    @DisplayName("GIVEN patient+member WHEN dispatch→accept→complete→list THEN statuses and list OK")
    void dispatchAcceptCompleteAndList() throws Exception {
        // GIVEN — JSON body
        String body =
                """
                {
                  "patientId": 501,
                  "assignedMemberId": %d,
                  "alertType": "MALAISE",
                  "title": "Integration mission",
                  "description": "test"
                }
                """
                        .formatted(memberId);

        // WHEN — dispatch
        MvcResult dispatchResult =
                mockMvc.perform(
                                post("/api/missions/dispatch")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .accept(MediaType.APPLICATION_JSON)
                                        .content(body))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.status").value("PENDING"))
                        .andExpect(jsonPath("$.assignedMemberId").value(memberId.intValue()))
                        .andReturn();

        JsonNode root = objectMapper.readTree(dispatchResult.getResponse().getContentAsString());
        long missionId = root.get("id").asLong();

        assertThat(notificationRepository.findByMemberIdOrderByCreatedAtDesc(memberId))
                .as("notification row uses is_read mapping — no reserved-word SQL failure")
                .anyMatch(n -> n.getMemberId().equals(memberId) && !n.isReadFlag());

        // WHEN — accept
        mockMvc.perform(
                        patch("/api/missions/" + missionId + "/accept")
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        // WHEN — complete
        mockMvc.perform(
                        patch("/api/missions/" + missionId + "/complete")
                                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        // WHEN — list for member
        MvcResult listResult =
                mockMvc.perform(get("/api/missions/my/" + memberId).accept(MediaType.APPLICATION_JSON))
                        .andExpect(status().isOk())
                        .andReturn();

        JsonNode list = objectMapper.readTree(listResult.getResponse().getContentAsString());
        assertThat(list.isArray()).isTrue();
        assertThat(list.size()).isGreaterThanOrEqualTo(1);
        boolean found =
                java.util.stream.StreamSupport.stream(list.spliterator(), false)
                        .anyMatch(n -> n.get("id").asLong() == missionId && "COMPLETED".equals(n.get("status").asText()));
        assertThat(found).isTrue();
    }

    @Test
    @DisplayName("GIVEN dispatch WHEN GET history/patient THEN row linked to mission")
    void dispatchCreatesDispatchHistoryForPatient() throws Exception {
        String body =
                """
                {
                  "patientId": 501,
                  "assignedMemberId": %d,
                  "alertType": "MALAISE",
                  "title": "History test mission",
                  "description": "test"
                }
                """
                        .formatted(memberId);

        MvcResult dispatchResult =
                mockMvc.perform(
                                post("/api/missions/dispatch")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .accept(MediaType.APPLICATION_JSON)
                                        .content(body))
                        .andExpect(status().isOk())
                        .andReturn();
        long missionId = objectMapper.readTree(dispatchResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/dispatch/history/patient/501").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].missionId").value((int) missionId))
                .andExpect(jsonPath("$[0].patientId").value(501));
    }
}
