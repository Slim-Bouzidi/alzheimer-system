package com.alzheimer.gestionlivreur.repository;

import com.alzheimer.gestionlivreur.entity.RouteStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RouteStopRepo extends JpaRepository<RouteStop, Long> {
    List<RouteStop> findByRouteIdOrderByStopOrderAsc(Long routeId);
    List<RouteStop> findByPatientId(Long patientId);

    @Modifying
    void deleteByPatientId(Long patientId);
}
