package com.alzheimer.gestionlivreur.controller;

import com.alzheimer.gestionlivreur.dto.MealSlotRequestDTO;
import com.alzheimer.gestionlivreur.dto.MealSlotResponseDTO;
import com.alzheimer.gestionlivreur.entity.MealType;
import com.alzheimer.gestionlivreur.service.interfaces.IMealSlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/meal-slots")
@RequiredArgsConstructor
public class MealSlotController {

    private final IMealSlotService mealSlotService;

    @PostMapping
    public ResponseEntity<MealSlotResponseDTO> create(@Valid @RequestBody MealSlotRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mealSlotService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MealSlotResponseDTO> update(@PathVariable Long id, @Valid @RequestBody MealSlotRequestDTO request) {
        return ResponseEntity.ok(mealSlotService.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MealSlotResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(mealSlotService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<MealSlotResponseDTO>> getAll() {
        return ResponseEntity.ok(mealSlotService.getAll());
    }

    @GetMapping("/type")
    public ResponseEntity<List<MealSlotResponseDTO>> getByMealType(@RequestParam MealType mealType) {
        return ResponseEntity.ok(mealSlotService.getByMealType(mealType));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        mealSlotService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
