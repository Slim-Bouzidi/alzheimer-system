package com.alzheimer.gestionlivreur.service.impl;

import com.alzheimer.gestionlivreur.dto.ShiftRequestDTO;
import com.alzheimer.gestionlivreur.dto.ShiftResponseDTO;
import com.alzheimer.gestionlivreur.entity.Shift;
import com.alzheimer.gestionlivreur.entity.StaffProfile;
import com.alzheimer.gestionlivreur.exception.ResourceNotFoundException;
import com.alzheimer.gestionlivreur.repository.ShiftRepo;
import com.alzheimer.gestionlivreur.repository.StaffProfileRepo;
import com.alzheimer.gestionlivreur.service.interfaces.IShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShiftServiceImpl implements IShiftService {

    private final ShiftRepo shiftRepo;
    private final StaffProfileRepo staffProfileRepo;

    @Override
    public ShiftResponseDTO create(ShiftRequestDTO request) {
        StaffProfile staff = staffProfileRepo.findById(request.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + request.getStaffId()));

        Shift shift = Shift.builder()
                .staff(staff)
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        return toResponse(shiftRepo.save(shift));
    }

    @Override
    public ShiftResponseDTO update(Long id, ShiftRequestDTO request) {
        Shift shift = shiftRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shift not found: " + id));

        StaffProfile staff = staffProfileRepo.findById(request.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + request.getStaffId()));

        shift.setStaff(staff);
        shift.setDayOfWeek(request.getDayOfWeek());
        shift.setStartTime(request.getStartTime());
        shift.setEndTime(request.getEndTime());
        if (request.getActive() != null) shift.setActive(request.getActive());

        return toResponse(shiftRepo.save(shift));
    }

    @Override
    public ShiftResponseDTO getById(Long id) {
        return toResponse(shiftRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shift not found: " + id)));
    }

    @Override
    public List<ShiftResponseDTO> getAll() {
        return shiftRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ShiftResponseDTO> getByStaff(Long staffId) {
        return shiftRepo.findByStaffId(staffId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<ShiftResponseDTO> getByDay(DayOfWeek day) {
        return shiftRepo.findByDayOfWeek(day).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public ShiftResponseDTO deactivate(Long id) {
        Shift shift = shiftRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shift not found: " + id));
        shift.setActive(false);
        return toResponse(shiftRepo.save(shift));
    }

    @Override
    public void delete(Long id) {
        if (!shiftRepo.existsById(id)) {
            throw new ResourceNotFoundException("Shift not found: " + id);
        }
        shiftRepo.deleteById(id);
    }

    private ShiftResponseDTO toResponse(Shift shift) {
        return ShiftResponseDTO.builder()
                .id(shift.getId())
                .staffId(shift.getStaff() != null ? shift.getStaff().getId() : null)
                .dayOfWeek(shift.getDayOfWeek())
                .startTime(shift.getStartTime())
                .endTime(shift.getEndTime())
                .active(shift.getActive())
                .build();
    }
}
