package com.alzheimer.gestionlivreur.service.impl;

import com.alzheimer.gestionlivreur.dto.MealSlotRequestDTO;
import com.alzheimer.gestionlivreur.dto.MealSlotResponseDTO;
import com.alzheimer.gestionlivreur.entity.MealSlot;
import com.alzheimer.gestionlivreur.entity.MealType;
import com.alzheimer.gestionlivreur.exception.ResourceNotFoundException;
import com.alzheimer.gestionlivreur.repository.MealSlotRepo;
import com.alzheimer.gestionlivreur.service.interfaces.IMealSlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MealSlotServiceImpl implements IMealSlotService {

    private final MealSlotRepo mealSlotRepo;

    @Override
    public MealSlotResponseDTO create(MealSlotRequestDTO request) {
        if (mealSlotRepo.existsByMealTypeAndTime(request.getMealType(), request.getTime())) {
            throw new IllegalStateException("Meal slot already exists for " + request.getMealType() + " at " + request.getTime());
        }

        MealSlot slot = MealSlot.builder()
                .time(request.getTime())
                .mealType(request.getMealType())
                .enabled(true)
                .label(request.getMealType().name() + " - " + request.getTime().toString())
                .build();

        return toResponse(mealSlotRepo.save(slot));
    }

    @Override
    public MealSlotResponseDTO update(Long id, MealSlotRequestDTO request) {
        MealSlot slot = mealSlotRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MealSlot not found: " + id));

        slot.setTime(request.getTime());
        slot.setMealType(request.getMealType());
        slot.setLabel(request.getMealType().name() + " - " + request.getTime().toString());

        return toResponse(mealSlotRepo.save(slot));
    }

    @Override
    public MealSlotResponseDTO getById(Long id) {
        return toResponse(mealSlotRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MealSlot not found: " + id)));
    }

    @Override
    public List<MealSlotResponseDTO> getAll() {
        return mealSlotRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<MealSlotResponseDTO> getByMealType(MealType mealType) {
        return mealSlotRepo.findByMealType(mealType).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(Long id) {
        if (!mealSlotRepo.existsById(id)) {
            throw new ResourceNotFoundException("MealSlot not found: " + id);
        }
        mealSlotRepo.deleteById(id);
    }

    private MealSlotResponseDTO toResponse(MealSlot slot) {
        return MealSlotResponseDTO.builder()
                .id(slot.getId())
                .time(slot.getTime())
                .mealType(slot.getMealType())
                .enabled(slot.getEnabled())
                .build();
    }
}
