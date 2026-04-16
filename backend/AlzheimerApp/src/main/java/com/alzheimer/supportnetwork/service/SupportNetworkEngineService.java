package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.domain.AlertType;
import com.alzheimer.supportnetwork.dto.engine.BestIntervenantsRequestDto;
import com.alzheimer.supportnetwork.dto.engine.BestIntervenantsResponseDto;
import com.alzheimer.supportnetwork.dto.engine.RankedIntervenantDto;
import com.alzheimer.supportnetwork.entity.AvailabilitySlot;
import com.alzheimer.supportnetwork.entity.MemberSkill;
import com.alzheimer.supportnetwork.entity.Patient;
import com.alzheimer.supportnetwork.entity.PatientSupportLink;
import com.alzheimer.supportnetwork.entity.SupportMember;
import com.alzheimer.supportnetwork.exception.NotFoundException;
import com.alzheimer.supportnetwork.repository.AvailabilitySlotRepository;
import com.alzheimer.supportnetwork.repository.MemberSkillRepository;
import com.alzheimer.supportnetwork.repository.PatientRepository;
import com.alzheimer.supportnetwork.repository.PatientSupportLinkRepository;
import com.alzheimer.supportnetwork.util.GeoUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Backend is the single source of truth for advanced business rules (Best Intervenants ranking).
 * <p>
 * Scoring: trust level (TRUSTED / NORMAL / other), priority rank on {@link PatientSupportLink},
 * availability at {@code now} (active slot, same ISO day-of-week 1=Monday..7=Sunday, inclusive
 * start/end times), proximity: {@link GeoUtils#distanceKm(double, double, double, double)} when both sides have
 * valid WGS84 coordinates (under 2 km +25, under 5 km +15, under 10 km +5), else same {@code zone}/{@code locationZone} match (+15),
 * HOME_ACCESS or canAccessHome (+10),
 * historical intervention reports on {@link SupportMember} ({@code (int)(averageRating * 5)} when
 * {@code totalRatings > 0}), a small {@link MemberSkill} profile bonus (capped), and optional
 * alert-aware skill boosts when {@link BestIntervenantsRequestDto#getAlertType()} is set.
 * Sort: score descending, then priority rank ascending, then name.
 * <p>
 * Do not re-implement this logic in the frontend; use {@code POST /api/engine/best-intervenants}.
 */
@Service
public class SupportNetworkEngineService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SupportNetworkEngineService.class);

    private final PatientRepository patientRepository;
    private final PatientSupportLinkRepository linkRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final MemberSkillRepository memberSkillRepository;

    public SupportNetworkEngineService(
            PatientRepository patientRepository,
            PatientSupportLinkRepository linkRepository,
            AvailabilitySlotRepository availabilitySlotRepository,
            MemberSkillRepository memberSkillRepository) {
        this.patientRepository = patientRepository;
        this.linkRepository = linkRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.memberSkillRepository = memberSkillRepository;
    }

    @Transactional(readOnly = true)
    public BestIntervenantsResponseDto rankBestIntervenants(BestIntervenantsRequestDto req) {
        Long patientId = req.getPatientId();
        if (patientId == null) {
            throw new IllegalArgumentException("patientId is required");
        }

        LocalDateTime now = req.getNow() != null ? req.getNow() : LocalDateTime.now();

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new NotFoundException("Patient not found: " + patientId));

        List<PatientSupportLink> links = linkRepository.findByPatient_Id(patientId);
        log.info("[Engine] Links found for patient {}: {}", patientId, links.size());
        if (links.isEmpty()) {
            return BestIntervenantsResponseDto.builder()
                    .patientId(patientId)
                    .generatedAt(now)
                    .items(List.of())
                    .build();
        }

        List<Long> memberIds = links.stream()
                .map(PatientSupportLink::getMember)
                .filter(Objects::nonNull)
                .map(m -> m.getId())
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        List<AvailabilitySlot> slots = availabilitySlotRepository.findByMember_IdIn(memberIds);
        log.info("[Engine] Availability slots found for members {}: {}", memberIds, slots.size());

        Map<Long, Set<String>> skillNamesByMemberId = loadSkillNamesByMemberId(memberIds);

        int currentDay = now.getDayOfWeek().getValue();
        LocalTime nowTime = now.toLocalTime();

        Set<Long> availableMemberIds = new HashSet<>();
        for (AvailabilitySlot slot : slots) {
            if (!slot.isActive() || slot.getDayOfWeek() != currentDay) continue;
            if (slot.getMember() == null || slot.getMember().getId() == null) continue;
            LocalTime start = slot.getStartTime();
            LocalTime end = slot.getEndTime();
            if (start != null && end != null && !nowTime.isBefore(start) && !nowTime.isAfter(end)) {
                availableMemberIds.add(slot.getMember().getId());
            }
        }
        log.info("[Engine] Members available now (day={}, time={}): {}", currentDay, nowTime, availableMemberIds);

        List<RankedIntervenantDto> items = new ArrayList<>();
        for (PatientSupportLink link : links) {
            SupportMember member = link.getMember();
            if (member == null || member.getId() == null) continue;

            int score = 0;
            List<String> reasons = new ArrayList<>();

            // Trust level
            String trust = link.getTrustLevel() != null ? link.getTrustLevel().toUpperCase() : "";
            if ("TRUSTED".equals(trust)) {
                score += 50;
                reasons.add("Trust level TRUSTED (+50)");
            } else if ("NORMAL".equals(trust)) {
                score += 20;
                reasons.add("Trust level NORMAL (+20)");
            } else {
                reasons.add("Trust level other (+0)");
            }

            // Priority rank
            int rank = link.getPriorityRank();
            if (rank == 1) {
                score += 40;
                reasons.add("Priority rank 1 (+40)");
            } else if (rank == 2) {
                score += 25;
                reasons.add("Priority rank 2 (+25)");
            } else if (rank == 3) {
                score += 15;
                reasons.add("Priority rank 3 (+15)");
            } else {
                score += 5;
                reasons.add("Priority rank " + (rank != 0 ? rank : "N/A") + " (+5)");
            }

            // Availability now
            if (availableMemberIds.contains(member.getId())) {
                score += 30;
                reasons.add("Available now (+30)");
            } else {
                score -= 20;
                reasons.add("Not available now (-20)");
            }

            Double distanceKmForDto = null;
            Double pLat = patient.getLatitude();
            Double pLon = patient.getLongitude();
            Double mLat = member.getLatitude();
            Double mLon = member.getLongitude();
            if (GeoUtils.isValidWgs84(pLat, pLon) && GeoUtils.isValidWgs84(mLat, mLon)) {
                double rawKm = GeoUtils.distanceKm(pLat, pLon, mLat, mLon);
                distanceKmForDto = Math.round(rawKm * 10.0) / 10.0;
                if (rawKm < 2) {
                    score += 25;
                    reasons.add("Very close to patient (+25)");
                } else if (rawKm < 5) {
                    score += 15;
                    reasons.add("Close to patient (+15)");
                } else if (rawKm < 10) {
                    score += 5;
                    reasons.add("Moderately close (+5)");
                }
            } else {
                String patientZone = patient.getZone() != null ? patient.getZone().trim() : "";
                String memberZone = member.getLocationZone() != null ? member.getLocationZone().trim() : "";
                if (!patientZone.isEmpty() && patientZone.equals(memberZone)) {
                    score += 15;
                    reasons.add("Same zone as patient (+15)");
                }
            }

            // Home access / permission
            boolean hasHomePermission = link.isCanAccessHome() ||
                    (link.getPermissions() != null && link.getPermissions().contains("HOME_ACCESS"));
            if (hasHomePermission) {
                score += 10;
                reasons.add("Home access allowed (+10)");
            }

            Double averageRatingForDto = null;
            if (member.getTotalRatings() > 0) {
                double avg = member.getAverageRating();
                int ratingBonus = (int) (avg * 5.0);
                if (ratingBonus != 0) {
                    score += ratingBonus;
                    reasons.add(String.format("Historical rating (%.1f) (+%d)", avg, ratingBonus));
                }
                averageRatingForDto = avg;
            }

            Set<String> memberSkillNames = skillNamesByMemberId.getOrDefault(member.getId(), Set.of());
            score = applyRegisteredSkillsProfileBonus(memberSkillNames.size(), score, reasons);
            score = applyAlertSkillBoosts(req.getAlertType(), memberSkillNames, score, reasons);
            List<String> skillsForDto = sortedSkillList(memberSkillNames);

            items.add(RankedIntervenantDto.builder()
                    .memberId(member.getId())
                    .fullName(member.getFullName())
                    .type(member.getType())
                    .score(score)
                    .reasons(reasons)
                    .availableNow(availableMemberIds.contains(member.getId()))
                    .averageRating(averageRatingForDto)
                    .skills(skillsForDto)
                    .distanceKm(distanceKmForDto)
                    .build());
        }
        log.info("[Engine] Ranked intervenants count: {}", items.size());

        // Sort: score desc, then priorityRank asc, then fullName asc
        Map<Long, Integer> priorityByMemberId = links.stream()
                .filter(l -> l.getMember() != null && l.getMember().getId() != null)
                .collect(Collectors.toMap(l -> l.getMember().getId(), PatientSupportLink::getPriorityRank, (a, b) -> a));
        items.sort((a, b) -> {
            int c = Integer.compare(b.getScore(), a.getScore());
            if (c != 0) return c;
            int pa = priorityByMemberId.getOrDefault(a.getMemberId(), 0);
            int pb = priorityByMemberId.getOrDefault(b.getMemberId(), 0);
            c = Integer.compare(pa, pb);
            if (c != 0) return c;
            String na = a.getFullName() != null ? a.getFullName() : "";
            String nb = b.getFullName() != null ? b.getFullName() : "";
            return na.compareTo(nb);
        });

        return BestIntervenantsResponseDto.builder()
                .patientId(patientId)
                .generatedAt(now)
                .items(items)
                .build();
    }

    private Map<Long, Set<String>> loadSkillNamesByMemberId(List<Long> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return Map.of();
        }
        List<MemberSkill> rows = memberSkillRepository.findByMember_IdIn(memberIds);
        Map<Long, Set<String>> map = new HashMap<>();
        for (MemberSkill ms : rows) {
            if (ms.getMember() == null || ms.getMember().getId() == null) {
                continue;
            }
            if (ms.getSkill() == null || ms.getSkill().getName() == null) {
                continue;
            }
            map.computeIfAbsent(ms.getMember().getId(), k -> new HashSet<>())
                    .add(ms.getSkill().getName().trim().toUpperCase(Locale.ROOT));
        }
        return map;
    }

    private static List<String> sortedSkillList(Set<String> upperNames) {
        List<String> list = new ArrayList<>(upperNames);
        Collections.sort(list);
        return list;
    }

    /**
     * Baseline score from the number of distinct {@link MemberSkill} rows (skills always influence ranking).
     */
    static int applyRegisteredSkillsProfileBonus(int distinctSkillCount, int score, List<String> reasons) {
        if (distinctSkillCount <= 0) {
            return score;
        }
        int bonus = Math.min(10, distinctSkillCount * 2);
        score += bonus;
        reasons.add(String.format("Registered skills profile (+%d)", bonus));
        return score;
    }

    /**
     * Alert-specific boosts from member {@link com.alzheimer.supportnetwork.entity.Skill} names (uppercase).
     */
    static int applyAlertSkillBoosts(AlertType alertType, Set<String> memberSkills, int score, List<String> reasons) {
        if (alertType == null || memberSkills == null || memberSkills.isEmpty()) {
            return score;
        }
        switch (alertType) {
            case MALAISE:
            case COMPORTEMENT:
                if (memberSkills.contains("DOCTOR")) {
                    score += 30;
                    reasons.add("Doctor skill (+30)");
                } else if (memberSkills.contains("NURSE")) {
                    score += 15;
                    reasons.add("Nurse skill (+15)");
                }
                break;
            case CHUTE:
                if (memberSkills.contains("CAREGIVER")) {
                    score += 20;
                    reasons.add("Caregiver skill (+20)");
                }
                break;
            case FUGUE:
                if (memberSkills.contains("FAMILY")) {
                    score += 20;
                    reasons.add("Family skill (+20)");
                }
                break;
            default:
                break;
        }
        return score;
    }
}
