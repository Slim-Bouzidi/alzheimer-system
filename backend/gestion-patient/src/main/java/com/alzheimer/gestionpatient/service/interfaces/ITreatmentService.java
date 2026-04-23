package com.alzheimer.gestionpatient.service.interfaces;

import com.alzheimer.gestionpatient.dto.TreatmentDTO;
import com.alzheimer.gestionpatient.entity.Treatment;

import java.util.List;

public interface ITreatmentService {
    List<Treatment> getAllTreatments();
    Treatment addTreatment(TreatmentDTO dto);
    Treatment updateTreatment(Treatment treatment);
    void deleteTreatment(Integer id);
    Treatment getTreatmentById(Integer id);
}
