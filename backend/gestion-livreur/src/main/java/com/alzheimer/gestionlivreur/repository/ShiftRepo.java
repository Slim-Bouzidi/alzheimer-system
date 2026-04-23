package com.alzheimer.gestionlivreur.repository;

import com.alzheimer.gestionlivreur.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;

@Repository
public interface ShiftRepo extends JpaRepository<Shift, Long> {
    List<Shift> findByStaffId(Long staffId);
    List<Shift> findByStaffIdAndActiveTrue(Long staffId);
    List<Shift> findByDayOfWeek(DayOfWeek dayOfWeek);
}
