package com.alzheimer.supportnetwork.config;

import com.alzheimer.supportnetwork.entity.Patient;
import com.alzheimer.supportnetwork.repository.PatientRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds test patients at startup if the patient table is empty.
 * For testing only; patient ids are provided manually (not auto-generated).
 */
@Component
public class PatientSeedRunner implements CommandLineRunner {

    private final PatientRepository patientRepository;

    public PatientSeedRunner(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Override
    public void run(String... args) {
        if (patientRepository.count() > 0) {
            return;
        }
        List<Patient> seed = List.of(
                Patient.builder().id(101L).fullName("Jean Dupont").zone("Ariana").build(),
                Patient.builder().id(102L).fullName("Sarra Ben Ali").zone("Tunis").build(),
                Patient.builder().id(103L).fullName("Hedi Trabelsi").zone("Sousse").build()
        );
        patientRepository.saveAll(seed);
    }
}
