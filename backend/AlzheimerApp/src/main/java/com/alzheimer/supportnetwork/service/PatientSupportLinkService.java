package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.dto.LinkCreateDto;
import com.alzheimer.supportnetwork.entity.Patient;
import com.alzheimer.supportnetwork.entity.PatientSupportLink;
import com.alzheimer.supportnetwork.entity.SupportMember;
import com.alzheimer.supportnetwork.exception.ConflictException;
import com.alzheimer.supportnetwork.exception.NotFoundException;
import com.alzheimer.supportnetwork.repository.PatientRepository;
import com.alzheimer.supportnetwork.repository.PatientSupportLinkRepository;
import com.alzheimer.supportnetwork.repository.SupportMemberRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PatientSupportLinkService {

    private final PatientSupportLinkRepository linkRepo;
    private final PatientRepository patientRepo;
    private final SupportMemberRepository memberRepo;

    public PatientSupportLinkService(PatientSupportLinkRepository linkRepo,
                                     PatientRepository patientRepo,
                                     SupportMemberRepository memberRepo) {
        this.linkRepo = linkRepo;
        this.patientRepo = patientRepo;
        this.memberRepo = memberRepo;
    }

    public PatientSupportLink create(LinkCreateDto dto) {

        Patient patient = patientRepo.findById(dto.getPatientId())
                .orElseThrow(() -> new NotFoundException("Patient not found: " + dto.getPatientId()));

        SupportMember member = memberRepo.findById(dto.getMemberId())
                .orElseThrow(() -> new NotFoundException("Member not found: " + dto.getMemberId()));

        if (linkRepo.existsByPatient_IdAndMember_Id(dto.getPatientId(), dto.getMemberId())) {
            throw new ConflictException("This member is already linked to this patient.");
        }

        PatientSupportLink link = PatientSupportLink.builder()
                .patient(patient)
                .member(member)
                .roleInNetwork(dto.getRoleInNetwork())
                .trustLevel(dto.getTrustLevel())
                .priorityRank(dto.getPriorityRank())
                .permissions(dto.getPermissions())
                .canAccessHome(dto.isCanAccessHome())
                .startAt(LocalDateTime.now())
                .endAt(null)
                .build();

        return linkRepo.save(link);
    }

    public List<PatientSupportLink> getNetworkByPatient(Long patientId) {
        return linkRepo.findByPatientId(patientId);
    }

    public PatientSupportLink update(Long linkId, LinkCreateDto dto) {
        PatientSupportLink link = linkRepo.findById(linkId)
                .orElseThrow(() -> new NotFoundException("Link not found: " + linkId));
        Patient patient = patientRepo.findById(dto.getPatientId())
                .orElseThrow(() -> new NotFoundException("Patient not found: " + dto.getPatientId()));
        SupportMember member = memberRepo.findById(dto.getMemberId())
                .orElseThrow(() -> new NotFoundException("Member not found: " + dto.getMemberId()));

        if (linkRepo.existsByPatient_IdAndMember_IdAndIdNot(
                dto.getPatientId(), dto.getMemberId(), linkId)) {
            throw new ConflictException("This member is already linked to this patient.");
        }

        link.setPatient(patient);
        link.setMember(member);
        link.setRoleInNetwork(dto.getRoleInNetwork());
        link.setTrustLevel(dto.getTrustLevel());
        link.setPriorityRank(dto.getPriorityRank());
        link.setPermissions(dto.getPermissions());
        link.setCanAccessHome(dto.isCanAccessHome());
        return linkRepo.save(link);
    }

    public void delete(Long linkId) {
        if (!linkRepo.existsById(linkId)) {
            throw new NotFoundException("Link not found: " + linkId);
        }
        linkRepo.deleteById(linkId);
    }
}
