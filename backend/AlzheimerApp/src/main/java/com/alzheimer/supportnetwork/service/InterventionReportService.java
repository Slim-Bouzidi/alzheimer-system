package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.domain.MissionStatus;
import com.alzheimer.supportnetwork.dto.report.ReportCreateRequestDto;
import com.alzheimer.supportnetwork.dto.report.ReportResponseDto;
import com.alzheimer.supportnetwork.entity.InterventionReport;
import com.alzheimer.supportnetwork.entity.Mission;
import com.alzheimer.supportnetwork.entity.SupportMember;
import com.alzheimer.supportnetwork.exception.ConflictException;
import com.alzheimer.supportnetwork.exception.NotFoundException;
import com.alzheimer.supportnetwork.repository.InterventionReportRepository;
import com.alzheimer.supportnetwork.repository.MissionRepository;
import com.alzheimer.supportnetwork.repository.SupportMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InterventionReportService {

    private final MissionRepository missionRepository;
    private final InterventionReportRepository reportRepository;
    private final SupportMemberRepository supportMemberRepository;

    public InterventionReportService(
            MissionRepository missionRepository,
            InterventionReportRepository reportRepository,
            SupportMemberRepository supportMemberRepository) {
        this.missionRepository = missionRepository;
        this.reportRepository = reportRepository;
        this.supportMemberRepository = supportMemberRepository;
    }

    @Transactional
    public ReportResponseDto createReport(ReportCreateRequestDto dto) {
        Mission mission = missionRepository.findById(dto.getMissionId())
                .orElseThrow(() -> new NotFoundException("Mission not found: " + dto.getMissionId()));

        if (mission.getStatus() != MissionStatus.COMPLETED) {
            throw new ConflictException("A report can only be created when the mission is COMPLETED (current status: "
                    + mission.getStatus() + ").");
        }

        if (!mission.getAssignedMemberId().equals(dto.getMemberId())) {
            throw new ConflictException(
                    "Only the assigned member for this mission can submit a report (assignee id: "
                            + mission.getAssignedMemberId() + ").");
        }

        if (reportRepository.existsByMissionId(mission.getId())) {
            throw new ConflictException("A report has already been submitted for this mission.");
        }

        String notes = dto.getNotes() != null ? dto.getNotes().trim() : "";

        InterventionReport entity = InterventionReport.builder()
                .missionId(mission.getId())
                .memberId(dto.getMemberId())
                .notes(notes.isEmpty() ? null : notes)
                .rating(dto.getRating())
                .createdAt(LocalDateTime.now())
                .build();

        ReportResponseDto saved = toDto(reportRepository.save(entity));
        applyReportToMemberReputation(dto.getMemberId(), dto.getRating());
        return saved;
    }

    /**
     * Updates {@link SupportMember#getAverageRating()} and {@link SupportMember#getTotalRatings()} using:
     * {@code newAverage = ((oldAverage * totalRatings) + newRating) / (totalRatings + 1)}.
     */
    private void applyReportToMemberReputation(Long memberId, int newRating) {
        SupportMember member = supportMemberRepository.findById(memberId)
                .orElseThrow(() -> new NotFoundException("Support member not found: " + memberId));
        double oldAverage = member.getAverageRating();
        int totalRatings = member.getTotalRatings();
        double newAverage = ((oldAverage * totalRatings) + newRating) / (totalRatings + 1);
        member.setAverageRating(newAverage);
        member.setTotalRatings(totalRatings + 1);
        supportMemberRepository.save(member);
    }

    @Transactional(readOnly = true)
    public List<ReportResponseDto> getReportsByMission(Long missionId) {
        return reportRepository.findByMissionIdOrderByCreatedAtDesc(missionId).stream()
                .map(this::toDto)
                .toList();
    }

    private ReportResponseDto toDto(InterventionReport r) {
        return ReportResponseDto.builder()
                .id(r.getId())
                .missionId(r.getMissionId())
                .memberId(r.getMemberId())
                .notes(r.getNotes())
                .rating(r.getRating())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
