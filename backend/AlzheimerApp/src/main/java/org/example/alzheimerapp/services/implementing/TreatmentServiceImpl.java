package org.example.alzheimerapp.services.implementing;

import org.example.alzheimerapp.entities.Treatment;
import org.example.alzheimerapp.repositories.TreatmentRepository;
import org.example.alzheimerapp.services.interfaces.ITreatmentService;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TreatmentServiceImpl implements ITreatmentService {

    private final TreatmentRepository treatmentRepository;

    public TreatmentServiceImpl(TreatmentRepository treatmentRepository) {
        this.treatmentRepository = treatmentRepository;
    }

    @Override
    public List<Treatment> getAllTreatments() {
        return treatmentRepository.findAll();
    }

    @Override
    public Treatment addTreatment(Treatment treatment) {
        return treatmentRepository.save(treatment);
    }

    @Override
    public Treatment updateTreatment(Treatment treatment) {
        return treatmentRepository.save(treatment);
    }

    @Transactional
    @Override
    public void deleteTreatment(Integer id) {
        Treatment treatment = treatmentRepository.findById(id).orElseThrow();
        if (treatment.getPatient() != null && treatment.getPatient().getTreatments() != null) {
            treatment.getPatient().getTreatments().removeIf(t -> t.getIdTreatment().equals(id));
        }
        treatmentRepository.delete(treatment);
    }

    @Override
    public Treatment getTreatmentById(Integer id) {
        return treatmentRepository.findById(id).orElseThrow();
    }
}
