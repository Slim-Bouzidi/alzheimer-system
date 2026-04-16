package com.alzheimer.supportnetwork.config;

import com.alzheimer.supportnetwork.entity.Patient;
import com.alzheimer.supportnetwork.entity.SupportMember;
import com.alzheimer.supportnetwork.repository.PatientRepository;
import com.alzheimer.supportnetwork.repository.SupportMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Demo coordinates (Tunis area) for distance-based ranking when rows still lack lat/lon.
 * Idempotent: only fills null coordinates.
 */
@Component
@Order(200)
public class DemoGeoCoordinatesInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoGeoCoordinatesInitializer.class);

    /** Example patient position (Ariana / northern Tunis). */
    private static final double DEMO_PATIENT_LAT = 36.8665;
    private static final double DEMO_PATIENT_LON = 10.1647;

    /** Nearby member (~0.5 km away for demo). */
    private static final double DEMO_MEMBER_LAT = 36.8670;
    private static final double DEMO_MEMBER_LON = 10.1650;

    private final PatientRepository patientRepository;
    private final SupportMemberRepository supportMemberRepository;

    public DemoGeoCoordinatesInitializer(
            PatientRepository patientRepository,
            SupportMemberRepository supportMemberRepository) {
        this.patientRepository = patientRepository;
        this.supportMemberRepository = supportMemberRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        int patients = 0;
        List<Patient> allPatients = patientRepository.findAll();
        for (Patient p : allPatients) {
            if (p.getLatitude() != null && p.getLongitude() != null) {
                continue;
            }
            String name = p.getFullName() != null ? p.getFullName().toLowerCase() : "";
            if (name.contains("ariana") || name.contains("ariane")) {
                p.setLatitude(DEMO_PATIENT_LAT);
                p.setLongitude(DEMO_PATIENT_LON);
                patientRepository.save(p);
                patients++;
            }
        }
        boolean fallbackPatient = false;
        if (patients == 0) {
            Optional<Patient> missing = allPatients.stream()
                    .filter(p -> p.getLatitude() == null || p.getLongitude() == null)
                    .min(Comparator.comparing(Patient::getId, Comparator.nullsLast(Comparator.naturalOrder())));
            if (missing.isPresent()) {
                Patient p = missing.get();
                p.setLatitude(DEMO_PATIENT_LAT);
                p.setLongitude(DEMO_PATIENT_LON);
                patientRepository.save(p);
                fallbackPatient = true;
            }
        }

        List<SupportMember> members = supportMemberRepository.findAll();
        int idx = 0;
        int membersUpdated = 0;
        final int maxMembersToSeed = 10;
        for (SupportMember m : members) {
            if (membersUpdated >= maxMembersToSeed) {
                break;
            }
            if (m.getLatitude() != null && m.getLongitude() != null) {
                continue;
            }
            double dLat = (idx % 5) * 0.0012;
            double dLon = (idx % 5) * 0.0010;
            m.setLatitude(DEMO_MEMBER_LAT + dLat);
            m.setLongitude(DEMO_MEMBER_LON + dLon);
            supportMemberRepository.save(m);
            membersUpdated++;
            idx++;
        }

        if (patients > 0 || fallbackPatient || membersUpdated > 0) {
            log.info("[Geo] Demo coordinates applied: {} patient(s) by name, {} fallback patient(s), {} member(s)",
                    patients, fallbackPatient ? 1 : 0, membersUpdated);
        }
    }
}
