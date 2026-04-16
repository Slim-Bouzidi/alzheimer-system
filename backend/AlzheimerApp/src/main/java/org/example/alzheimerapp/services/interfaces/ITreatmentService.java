package org.example.alzheimerapp.services.interfaces;

import org.example.alzheimerapp.entities.Treatment;

import java.util.List;

public interface ITreatmentService {

    List<Treatment> getAllTreatments();

    Treatment addTreatment(Treatment treatment);

    Treatment updateTreatment(Treatment treatment);

    void deleteTreatment(Integer id);

    Treatment getTreatmentById(Integer id);
}

