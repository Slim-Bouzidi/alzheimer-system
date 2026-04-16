package com.alzheimer.supportnetwork.repository;

import com.alzheimer.supportnetwork.entity.AvailabilitySlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {

    // ✅ الصحيح: member -> id
    List<AvailabilitySlot> findByMember_Id(Long memberId);

    /** Find slots for multiple members (for dispatch planner). */
    List<AvailabilitySlot> findByMember_IdIn(List<Long> memberIds);

    long countByMember_Id(Long memberId);

    void deleteByMember_Id(Long memberId);

    // (اختياري) مرتّبة حسب النهار والوقت
    List<AvailabilitySlot> findByMember_IdOrderByDayOfWeekAscStartTimeAsc(Long memberId);
}
