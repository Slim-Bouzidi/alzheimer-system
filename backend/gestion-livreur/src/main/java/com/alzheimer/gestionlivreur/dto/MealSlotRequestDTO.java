package com.alzheimer.gestionlivreur.dto;

import com.alzheimer.gestionlivreur.entity.MealType;
import lombok.*;

import javax.validation.constraints.NotNull;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealSlotRequestDTO {

    @NotNull
    private LocalTime time;

    @NotNull
    private MealType mealType;
}
