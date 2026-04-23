package com.alzheimer.gestionlivreur.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import javax.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate routeDate;

    @ManyToOne
    @JoinColumn(name = "meal_slot_id")
    private MealSlot mealSlot;

    @ManyToOne
    @JoinColumn(name = "staff_id")
    private StaffProfile staff;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RouteStatus status = RouteStatus.PLANNED;

    @Builder.Default
    private Boolean active = true;

    private String label;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<RouteStop> stops;
}
