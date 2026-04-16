package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.dto.member.SupportMemberDto;
import com.alzheimer.supportnetwork.entity.MemberSkill;
import com.alzheimer.supportnetwork.entity.Skill;
import com.alzheimer.supportnetwork.entity.SupportMember;
import com.alzheimer.supportnetwork.exception.ConflictException;
import com.alzheimer.supportnetwork.exception.NotFoundException;
import com.alzheimer.supportnetwork.repository.AvailabilitySlotRepository;
import com.alzheimer.supportnetwork.repository.InterventionReportRepository;
import com.alzheimer.supportnetwork.repository.MemberSkillRepository;
import com.alzheimer.supportnetwork.repository.MissionRepository;
import com.alzheimer.supportnetwork.repository.PatientSupportLinkRepository;
import com.alzheimer.supportnetwork.repository.SkillRepository;
import com.alzheimer.supportnetwork.repository.SupportMemberRepository;
import com.alzheimer.supportnetwork.util.GeoUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SupportMemberService {

    private final SupportMemberRepository supportMemberRepository;
    private final MemberSkillRepository memberSkillRepository;
    private final SkillRepository skillRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final PatientSupportLinkRepository patientSupportLinkRepository;
    private final MissionRepository missionRepository;
    private final InterventionReportRepository interventionReportRepository;

    public SupportMemberService(
            SupportMemberRepository supportMemberRepository,
            MemberSkillRepository memberSkillRepository,
            SkillRepository skillRepository,
            AvailabilitySlotRepository availabilitySlotRepository,
            PatientSupportLinkRepository patientSupportLinkRepository,
            MissionRepository missionRepository,
            InterventionReportRepository interventionReportRepository) {
        this.supportMemberRepository = supportMemberRepository;
        this.memberSkillRepository = memberSkillRepository;
        this.skillRepository = skillRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.patientSupportLinkRepository = patientSupportLinkRepository;
        this.missionRepository = missionRepository;
        this.interventionReportRepository = interventionReportRepository;
    }

    @Transactional(readOnly = true)
    public List<SupportMemberDto> findAllWithSkills() {
        List<SupportMember> members = supportMemberRepository.findAll();
        if (members.isEmpty()) {
            return List.of();
        }
        List<Long> ids = members.stream().map(SupportMember::getId).filter(Objects::nonNull).toList();
        Map<Long, List<String>> skillsByMember = loadSkillNamesByMemberIds(ids);
        return members.stream().map(m -> toDto(m, skillsByMember.getOrDefault(m.getId(), List.of()))).toList();
    }

    @Transactional(readOnly = true)
    public SupportMemberDto getById(Long id) {
        SupportMember m = supportMemberRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Member not found: " + id));
        List<String> skills = loadSkillNamesForMember(m.getId());
        return toDto(m, skills);
    }

    @Transactional
    public SupportMemberDto create(SupportMemberDto dto) {
        GeoUtils.validateOptionalCoordinates(dto.getLatitude(), dto.getLongitude());
        SupportMember m = new SupportMember();
        applyBasics(dto, m);
        m = supportMemberRepository.save(m);
        replaceMemberSkills(m.getId(), dto.getSkills());
        return getById(m.getId());
    }

    @Transactional
    public SupportMemberDto update(Long id, SupportMemberDto dto) {
        GeoUtils.validateOptionalCoordinates(dto.getLatitude(), dto.getLongitude());
        SupportMember m = supportMemberRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Member not found: " + id));
        applyBasics(dto, m);
        supportMemberRepository.save(m);
        replaceMemberSkills(id, dto.getSkills());
        return getById(id);
    }

    @Transactional
    public void delete(Long id) {
        if (!supportMemberRepository.existsById(id)) {
            throw new NotFoundException("Member not found: " + id);
        }
        long missionRefs = missionRepository.countByAssignedMemberId(id);
        long reportRefs = interventionReportRepository.countByMemberId(id);
        if (missionRefs > 0 || reportRefs > 0) {
            throw new ConflictException(
                    "Cannot delete this member because it is referenced by "
                            + missionRefs
                            + " mission(s) and "
                            + reportRefs
                            + " intervention report(s).");
        }

        // Safe cleanup for direct FK relations before deleting the member.
        availabilitySlotRepository.deleteByMember_Id(id);
        patientSupportLinkRepository.deleteByMember_Id(id);
        memberSkillRepository.deleteByMember_Id(id);
        supportMemberRepository.deleteById(id);
    }

    private static void applyBasics(SupportMemberDto dto, SupportMember m) {
        m.setFullName(dto.getFullName());
        m.setPhone(dto.getPhone());
        if (dto.getEmail() != null) {
            String trimmed = dto.getEmail().trim();
            m.setEmail(trimmed.isEmpty() ? null : trimmed);
        } else {
            m.setEmail(null);
        }
        m.setType(dto.getType());
        m.setLocationZone(dto.getLocationZone());
        m.setLatitude(dto.getLatitude());
        m.setLongitude(dto.getLongitude());
        m.setNotes(dto.getNotes());
    }

    private Map<Long, List<String>> loadSkillNamesByMemberIds(Collection<Long> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return Map.of();
        }
        List<MemberSkill> rows = memberSkillRepository.findByMember_IdIn(memberIds);
        Map<Long, Set<String>> tmp = new HashMap<>();
        for (MemberSkill ms : rows) {
            if (ms.getMember() == null || ms.getMember().getId() == null) {
                continue;
            }
            if (ms.getSkill() == null || ms.getSkill().getName() == null) {
                continue;
            }
            tmp.computeIfAbsent(ms.getMember().getId(), k -> new TreeSet<>()).add(ms.getSkill().getName());
        }
        Map<Long, List<String>> out = new LinkedHashMap<>();
        for (Map.Entry<Long, Set<String>> e : tmp.entrySet()) {
            out.put(e.getKey(), new ArrayList<>(e.getValue()));
        }
        return out;
    }

    private List<String> loadSkillNamesForMember(Long memberId) {
        if (memberId == null) {
            return List.of();
        }
        return memberSkillRepository.findByMember_Id(memberId).stream()
                .map(MemberSkill::getSkill)
                .filter(Objects::nonNull)
                .map(Skill::getName)
                .filter(Objects::nonNull)
                .sorted()
                .collect(Collectors.toList());
    }

    private void replaceMemberSkills(Long memberId, List<String> skillNames) {
        memberSkillRepository.deleteByMember_Id(memberId);
        if (skillNames == null || skillNames.isEmpty()) {
            return;
        }
        SupportMember memberRef = supportMemberRepository.getReferenceById(memberId);
        for (String raw : skillNames) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            String name = raw.trim();
            Skill skill = skillRepository.findByNameIgnoreCase(name).orElse(null);
            if (skill == null) {
                continue;
            }
            memberSkillRepository.save(MemberSkill.builder().member(memberRef).skill(skill).build());
        }
    }

    private static SupportMemberDto toDto(SupportMember m, List<String> skills) {
        return SupportMemberDto.builder()
                .id(m.getId())
                .fullName(m.getFullName())
                .phone(m.getPhone())
                .email(m.getEmail())
                .type(m.getType())
                .locationZone(m.getLocationZone())
                .latitude(m.getLatitude())
                .longitude(m.getLongitude())
                .notes(m.getNotes())
                .averageRating(m.getTotalRatings() > 0 ? m.getAverageRating() : null)
                .totalRatings(m.getTotalRatings())
                .skills(skills != null ? skills : List.of())
                .build();
    }
}
