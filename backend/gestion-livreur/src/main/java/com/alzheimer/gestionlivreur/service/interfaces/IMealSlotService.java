package com.alzheimer.gestionlivreur.service.interfaces;

import com.alzheimer.gestionlivreur.dto.MealSlotRequestDTO;
import com.alzheimer.gestionlivreur.dto.MealSlotResponseDTO;
import com.alzheimer.gestionlivreur.entity.MealType;

import java.util.List;

public interface IMealSlotService {
    MealSlotResponseDTO create(MealSlotRequestDTO request);
    MealSlotResponseDTO update(Long id, MealSlotRequestDTO request);
    MealSlotResponseDTO getById(Long id);
    List<MealSlotResponseDTO> getAll();
    List<MealSlotResponseDTO> getByMealType(MealType mealType);
    void delete(Long id);
}
