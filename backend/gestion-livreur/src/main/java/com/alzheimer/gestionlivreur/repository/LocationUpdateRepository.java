package com.alzheimer.gestionlivreur.repository;

import com.alzheimer.gestionlivreur.entity.LocationUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationUpdateRepository extends JpaRepository<LocationUpdate, Long> {
    Optional<LocationUpdate> findTopByStaffIdAndRouteIdOrderByTimestampDesc(Long staffId, Long routeId);
    Optional<LocationUpdate> findTopByRouteIdOrderByTimestampDesc(Long routeId);
    List<LocationUpdate> findByRouteIdOrderByTimestampAsc(Long routeId);
}
