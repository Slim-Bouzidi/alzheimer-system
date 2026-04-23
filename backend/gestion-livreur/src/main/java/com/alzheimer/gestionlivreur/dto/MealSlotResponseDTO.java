package com.alzheimer.gestionlivreur.dto;

import com.alzheimer.gestionlivreur.entity.MealType;
import lombok.*;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealSlotResponseDTO {
    private Long id;
    private LocalTime time;
    private MealType mealType;
    private Boolean enabled;
}
