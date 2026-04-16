package com.alzheimer.supportnetwork.service;

import com.alzheimer.supportnetwork.dto.AvailabilityCreateDto;
import com.alzheimer.supportnetwork.entity.AvailabilitySlot;
import com.alzheimer.supportnetwork.entity.SupportMember;
import com.alzheimer.supportnetwork.exception.NotFoundException;
import com.alzheimer.supportnetwork.repository.AvailabilitySlotRepository;
import com.alzheimer.supportnetwork.repository.SupportMemberRepository;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class AvailabilityService {

    private final AvailabilitySlotRepository slotRepo;
    private final SupportMemberRepository memberRepo;

    public AvailabilityService(AvailabilitySlotRepository slotRepo, SupportMemberRepository memberRepo) {
        this.slotRepo = slotRepo;
        this.memberRepo = memberRepo;
    }

    public AvailabilitySlot create(AvailabilityCreateDto dto) {
        SupportMember member = memberRepo.findById(dto.getMemberId())
                .orElseThrow(() -> new NotFoundException("Member not found: " + dto.getMemberId()));

        validateSlotInput(dto);

        AvailabilitySlot slot = AvailabilitySlot.builder()
                .member(member)
                .dayOfWeek(dto.getDayOfWeek())
                .startTime(LocalTime.parse(dto.getStartTime()))
                .endTime(LocalTime.parse(dto.getEndTime()))
                .active(dto.isActive())
                .build();

        return slotRepo.save(slot);
    }

    public List<AvailabilitySlot> getByMember(Long memberId) {
        // ✅ استعمل النسخة المرتبة (اختياري)
        return slotRepo.findByMember_IdOrderByDayOfWeekAscStartTimeAsc(memberId);
        // أو:
        // return slotRepo.findByMember_Id(memberId);
    }

    public AvailabilitySlot update(Long id, AvailabilityCreateDto dto) {
        AvailabilitySlot slot = slotRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Slot not found: " + id));

        // (اختياري) إذا تحب تبدّل member زادة (مش لازم)
        if (dto.getMemberId() != null && (slot.getMember() == null || !slot.getMember().getId().equals(dto.getMemberId()))) {
            SupportMember member = memberRepo.findById(dto.getMemberId())
                    .orElseThrow(() -> new NotFoundException("Member not found: " + dto.getMemberId()));
            slot.setMember(member);
        }

        validateSlotInput(dto);

        slot.setDayOfWeek(dto.getDayOfWeek());
        slot.setStartTime(LocalTime.parse(dto.getStartTime()));
        slot.setEndTime(LocalTime.parse(dto.getEndTime()));
        slot.setActive(dto.isActive());

        return slotRepo.save(slot);
    }

    public void delete(Long id) {
        if (!slotRepo.existsById(id)) {
            throw new NotFoundException("Slot not found: " + id);
        }
        slotRepo.deleteById(id);
    }

    private void validateSlotInput(AvailabilityCreateDto dto) {
        int dow = dto.getDayOfWeek();
        if (dow < 1 || dow > 7) {
            throw new IllegalArgumentException("dayOfWeek must be between 1 (Monday) and 7 (Sunday).");
        }
        if (dto.getStartTime() == null || dto.getEndTime() == null) {
            throw new IllegalArgumentException("startTime and endTime are required.");
        }
        LocalTime start;
        LocalTime end;
        try {
            start = LocalTime.parse(dto.getStartTime().trim());
            end = LocalTime.parse(dto.getEndTime().trim());
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid time format; use HH:mm (e.g. 08:00).");
        }
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException("endTime must be after startTime.");
        }
    }
}
