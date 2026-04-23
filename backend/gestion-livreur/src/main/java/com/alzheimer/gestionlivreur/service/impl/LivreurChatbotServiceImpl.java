package com.alzheimer.gestionlivreur.service.impl;

import com.alzheimer.gestionlivreur.dto.ChatbotAskRequestDTO;
import com.alzheimer.gestionlivreur.dto.ChatbotAskResponseDTO;
import com.alzheimer.gestionlivreur.dto.ChatbotQuestionDTO;
import com.alzheimer.gestionlivreur.entity.*;
import com.alzheimer.gestionlivreur.repository.*;
import com.alzheimer.gestionlivreur.service.interfaces.ILivreurChatbotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LivreurChatbotServiceImpl implements ILivreurChatbotService {

    private final DeliveryTaskRepo deliveryTaskRepo;
    private final RouteRepo routeRepo;
    private final StaffProfileRepo staffProfileRepo;
    private final PatientRepository patientRepository;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    private static final Map<String, String> PREDEFINED_QUESTIONS = new LinkedHashMap<>();

    static {
        PREDEFINED_QUESTIONS.put("TODAY_DELIVERY_SUMMARY", "Résumé des livraisons du jour");
        PREDEFINED_QUESTIONS.put("PENDING_PATIENTS", "Patients en attente de livraison");
        PREDEFINED_QUESTIONS.put("ROUTES_PROGRESS", "Progression des tournées");
        PREDEFINED_QUESTIONS.put("STAFF_AVAILABILITY", "Disponibilité du personnel");
    }

    @Override
    public List<ChatbotQuestionDTO> getPredefinedQuestions() {
        return PREDEFINED_QUESTIONS.entrySet().stream()
                .map(e -> ChatbotQuestionDTO.builder().key(e.getKey()).label(e.getValue()).build())
                .collect(Collectors.toList());
    }

    @Override
    public ChatbotAskResponseDTO askPredefinedQuestion(ChatbotAskRequestDTO request) {
        String questionKey = request.getQuestionKey();
        String questionLabel = PREDEFINED_QUESTIONS.get(questionKey);

        if (questionLabel == null) {
            return ChatbotAskResponseDTO.builder()
                    .questionKey(questionKey)
                    .questionLabel("Unknown")
                    .answer("Question inconnue: " + questionKey)
                    .generatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                    .build();
        }

        String deterministicAnswer = generateDeterministicAnswer(questionKey, request.getStaffUsername());

        // Try Gemini enhancement
        String enhancedAnswer = tryGeminiEnhancement(questionLabel, deterministicAnswer);

        return ChatbotAskResponseDTO.builder()
                .questionKey(questionKey)
                .questionLabel(questionLabel)
                .answer(enhancedAnswer != null ? enhancedAnswer : deterministicAnswer)
                .generatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .build();
    }

    private String generateDeterministicAnswer(String questionKey, String staffUsername) {
        LocalDate today = LocalDate.now();

        switch (questionKey) {
            case "TODAY_DELIVERY_SUMMARY": {
                List<DeliveryTask> todayTasks = deliveryTaskRepo.findByDeliveryDate(today);
                if (staffUsername != null && !staffUsername.isBlank()) {
                    StaffProfile staff = staffProfileRepo.findByUsernameIgnoreCase(staffUsername).orElse(null);
                    if (staff != null) {
                        todayTasks = todayTasks.stream()
                                .filter(t -> staff.getId().equals(t.getAssignedStaffId()))
                                .collect(Collectors.toList());
                    }
                }
                long total = todayTasks.size();
                long delivered = todayTasks.stream().filter(t -> t.getStatus() == DeliveryStatus.DELIVERED).count();
                long planned = todayTasks.stream().filter(t -> t.getStatus() == DeliveryStatus.PLANNED).count();
                long confirmed = todayTasks.stream().filter(t -> t.getStatus() == DeliveryStatus.CONFIRMED).count();
                return String.format("Livraisons du %s : %d au total, %d livrées, %d planifiées, %d confirmées.",
                        today, total, delivered, planned, confirmed);
            }
            case "PENDING_PATIENTS": {
                List<DeliveryTask> pendingTasks = deliveryTaskRepo.findByDeliveryDateAndStatus(today, DeliveryStatus.PLANNED);
                if (staffUsername != null && !staffUsername.isBlank()) {
                    StaffProfile staff = staffProfileRepo.findByUsernameIgnoreCase(staffUsername).orElse(null);
                    if (staff != null) {
                        pendingTasks = pendingTasks.stream()
                                .filter(t -> staff.getId().equals(t.getAssignedStaffId()))
                                .collect(Collectors.toList());
                    }
                }
                List<String> patientNames = new ArrayList<>();
                for (DeliveryTask task : pendingTasks) {
                    patientRepository.findById(task.getPatientId()).ifPresent(p ->
                            patientNames.add(p.getFirstName() + " " + p.getLastName()));
                }
                if (patientNames.isEmpty()) return "Aucun patient en attente de livraison aujourd'hui.";
                return "Patients en attente (" + patientNames.size() + ") : " + String.join(", ", patientNames) + ".";
            }
            case "ROUTES_PROGRESS": {
                List<Route> todayRoutes = routeRepo.findByRouteDate(today);
                if (todayRoutes.isEmpty()) return "Aucune tournée planifiée pour aujourd'hui.";
                long done = todayRoutes.stream().filter(r -> r.getStatus() == RouteStatus.DONE).count();
                long inProgress = todayRoutes.stream().filter(r -> r.getStatus() == RouteStatus.IN_PROGRESS).count();
                long planned = todayRoutes.stream().filter(r -> r.getStatus() == RouteStatus.PLANNED).count();
                return String.format("Tournées du %s : %d au total, %d terminées, %d en cours, %d planifiées.",
                        today, todayRoutes.size(), done, inProgress, planned);
            }
            case "STAFF_AVAILABILITY": {
                List<StaffProfile> activeStaff = staffProfileRepo.findByActiveTrue();
                if (activeStaff.isEmpty()) return "Aucun personnel actif trouvé.";
                String names = activeStaff.stream()
                        .map(s -> s.getFullName() + " (" + s.getUsername() + ")")
                        .collect(Collectors.joining(", "));
                return "Personnel actif (" + activeStaff.size() + ") : " + names + ".";
            }
            default:
                return "Question non reconnue.";
        }
    }

    private String tryGeminiEnhancement(String questionLabel, String deterministicAnswer) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return null;
        }

        try {
            String prompt = "Tu es un assistant pour un service de livraison de repas à des patients Alzheimer. " +
                    "Voici la question posée : \"" + questionLabel + "\"\n" +
                    "Voici les données actuelles : " + deterministicAnswer + "\n" +
                    "Reformule cette réponse de manière claire et concise en français, en gardant toutes les données.";

            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;

            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> content = new HashMap<>();
            Map<String, String> part = new HashMap<>();
            part.put("text", prompt);
            content.put("parts", List.of(part));
            requestBody.put("contents", List.of(content));

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> firstCandidate = candidates.get(0);
                    Map<String, Object> contentResp = (Map<String, Object>) firstCandidate.get("content");
                    if (contentResp != null) {
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) contentResp.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            return (String) parts.get(0).get("text");
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Gemini API call failed, falling back to deterministic answer: {}", e.getMessage());
        }

        return null;
    }
}
