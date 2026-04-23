package com.alzheimer.gestionlivreur.repository;

import com.alzheimer.gestionlivreur.entity.MealSlot;
import com.alzheimer.gestionlivreur.entity.MealType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MealSlotRepo extends JpaRepository<MealSlot, Long> {
    List<MealSlot> findByMealType(MealType mealType);
    Optional<MealSlot> findByMealTypeAndTime(MealType mealType, LocalTime time);
    boolean existsByMealTypeAndTime(MealType mealType, LocalTime time);
}
