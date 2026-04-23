package com.alzheimer.gestionlivreur.repository;

import com.alzheimer.gestionlivreur.entity.Route;
import com.alzheimer.gestionlivreur.entity.RouteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RouteRepo extends JpaRepository<Route, Long> {
    List<Route> findByRouteDate(LocalDate date);
    List<Route> findByStaffId(Long staffId);
    List<Route> findByRouteDateAndStatus(LocalDate date, RouteStatus status);
}
