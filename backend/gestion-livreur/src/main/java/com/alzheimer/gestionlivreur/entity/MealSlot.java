package com.alzheimer.gestionlivreur.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import javax.persistence.*;
import java.time.LocalTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MealSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalTime time;

    @Enumerated(EnumType.STRING)
    private MealType mealType;

    @Builder.Default
    private Boolean enabled = true;

    private String label;

    @OneToMany(mappedBy = "mealSlot", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<DeliveryTask> tasks;
}
