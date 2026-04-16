package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.dto.dispatch.*;
import com.alzheimer.supportnetwork.dto.engine.BestIntervenantsRequestDto;
import com.alzheimer.supportnetwork.dto.engine.BestIntervenantsResponseDto;
import com.alzheimer.supportnetwork.dto.engine.RankedIntervenantDto;
import com.alzheimer.supportnetwork.entity.PatientSupportLink;
import com.alzheimer.supportnetwork.repository.PatientSupportLinkRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Backend is the single source of truth for advanced business rules (dispatch plan generation).
 * <p>
 * Flow: rank all linked members via {@link SupportNetworkEngineService#rankBestIntervenants},
 * then keep candidates that are available now ({@link com.alzheimer.supportnetwork.dto.engine.RankedIntervenantDto#getAvailableNow()})
 * and pass {@link #passesAlertFilter} for the requested {@link com.alzheimer.supportnetwork.domain.AlertType}.
 * If that yields nobody but the ranked list is non-empty, fall back to the full ranked list and set
 * an explanatory {@link com.alzheimer.supportnetwork.dto.dispatch.DispatchPlanDto#getMessage() message}.
 * <p>
 * Alert-type permission gates ({@link #passesAlertFilter}): CHUTE requires home access;
 * FUGUE requires GPS_VIEW; MALAISE has no extra permission filter (all links pass).
 * <p>
 * Do not re-implement this logic in the frontend; use {@code POST /api/dispatch/plan}.
 */
@Service
public class AlertDispatchPlannerService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AlertDispatchPlannerService.class);

    /** In-memory escalation plans keyed by mission id (demo-friendly; cleared on accept / final escalation). */
    private final Map<Long, DispatchPlanDto> escalationPlansByMissionId = new ConcurrentHashMap<>();

    private final SupportNetworkEngineService supportNetworkEngineService;
    private final PatientSupportLinkRepository linkRepository;

    public AlertDispatchPlannerService(
            SupportNetworkEngineService supportNetworkEngineService,
            PatientSupportLinkRepository linkRepository) {
        this.supportNetworkEngineService = supportNetworkEngineService;
        this.linkRepository = linkRepository;
    }

    @Transactional
    public DispatchPlanDto generatePlan(DispatchPlanRequestDto req) {
        Long patientId = req.getPatientId();
        if (patientId == null) {
            throw new IllegalArgumentException("patientId is required");
        }

        LocalDateTime now = req.getNow() != null ? req.getNow() : LocalDateTime.now();

        List<PatientSupportLink> links = linkRepository.findByPatient_Id(patientId);
        if (links.isEmpty()) {
            log.info("[Dispatch] No links found for patient {}", patientId);
            return DispatchPlanDto.builder()
                    .patientId(patientId)
                    .alertType(req.getAlertType())
                    .generatedAt(now)
                    .steps(List.of())
                    .message("No links for this patient.")
                    .build();
        }

        BestIntervenantsResponseDto response = supportNetworkEngineService.rankBestIntervenants(
                BestIntervenantsRequestDto.builder()
                        .patientId(patientId)
                        .now(now)
                        .alertType(req.getAlertType())
                        .build());

        Map<Long, PatientSupportLink> linkByMemberId = links.stream()
                .filter(l -> l.getMember() != null && l.getMember().getId() != null)
                .collect(Collectors.toMap(l -> l.getMember().getId(), l -> l, (a, b) -> a));

        List<RankedIntervenantDto> ranked = response.getItems();
        log.info("[Dispatch] Ranked intervenants from engine: {}", ranked.size());

        List<RankedIntervenantDto> candidates = ranked.stream()
                .filter(i -> Boolean.TRUE.equals(i.getAvailableNow()))
                .filter(i -> passesAlertFilter(linkByMemberId.get(i.getMemberId()), req.getAlertType()))
                .toList();
        log.info("[Dispatch] Candidates after availability+alert filter: {}", candidates.size());

        String message = null;
        // If strict filtering removes everybody but there are ranked candidates,
        // fall back to ranked list so UI can still display a plan.
        if (candidates.isEmpty() && !ranked.isEmpty()) {
            log.info("[Dispatch] No strict candidates, falling back to ranked list (size={})", ranked.size());
            candidates = ranked;
            message = "No strictly available responders; showing best candidates ignoring availability/permissions.";
        }

        int[] stepSizes = {1, 2, 3};
        int[] timeouts = {2, 3, 4};
        List<DispatchStepDto> steps = new ArrayList<>();
        int index = 0;

        for (int s = 0; s < stepSizes.length; s++) {
            int take = stepSizes[s];
            List<DispatchAssigneeDto> assignees = new ArrayList<>();
            for (int i = 0; i < take && index < candidates.size(); i++, index++) {
                RankedIntervenantDto c = candidates.get(index);
                assignees.add(DispatchAssigneeDto.builder()
                        .memberId(c.getMemberId())
                        .fullName(c.getFullName())
                        .type(c.getType() != null ? c.getType() : "")
                        .score(c.getScore())
                        .reasons(c.getReasons())
                        .build());
            }
            if (assignees.isEmpty()) continue;

            String note = (s == 2) ? "Escalation: notify wider network / admin" : null;
            steps.add(DispatchStepDto.builder()
                    .stepNumber(s + 1)
                    .timeoutMinutes(timeouts[s])
                    .assignees(assignees)
                    .note(note)
                    .build());
        }


        return DispatchPlanDto.builder()
                .patientId(patientId)
                .alertType(req.getAlertType())
                .generatedAt(now)
                .steps(steps)
                .message(message)
                .build();
    }

    /**
     * Stores the dispatch plan for background escalation ({@link EscalationSchedulerService}).
     * Called when a {@link com.alzheimer.supportnetwork.entity.Mission} is created for the same patient/alert context.
     */
    public void storePlanForMission(Long missionId, DispatchPlanDto plan) {
        if (missionId == null || plan == null) {
            return;
        }
        escalationPlansByMissionId.put(missionId, plan);
        log.debug("[Dispatch] Stored escalation plan for mission {} ({} steps)", missionId,
                plan.getSteps() != null ? plan.getSteps().size() : 0);
    }

    public DispatchPlanDto getStoredPlanForMission(Long missionId) {
        return missionId == null ? null : escalationPlansByMissionId.get(missionId);
    }

    public void removeStoredPlanForMission(Long missionId) {
        if (missionId != null) {
            escalationPlansByMissionId.remove(missionId);
        }
    }

    /**
     * Per-alert permission gate applied <em>after</em> ranking. MALAISE intentionally does not
     * require MEDICAL_NOTES or any other permission — all non-null links pass for MALAISE.
     */
    private boolean passesAlertFilter(PatientSupportLink link, AlertType alertType) {
        if (link == null) return false;
        if (alertType == null) return true;
        Set<String> perms = link.getPermissions() != null ? link.getPermissions() : Set.of();
        switch (alertType) {
            case CHUTE:
                return perms.contains("HOME_ACCESS") || link.isCanAccessHome();
            case FUGUE:
                return perms.contains("GPS_VIEW");
            case MALAISE:
            case COMPORTEMENT:
                // No stricter filter: broader candidate set for general malaise / comportement response.
                return true;
            default:
                return true;
        }
    }
}
