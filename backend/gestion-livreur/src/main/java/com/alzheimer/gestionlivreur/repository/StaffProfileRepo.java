package com.alzheimer.gestionlivreur.repository;

import com.alzheimer.gestionlivreur.entity.StaffProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffProfileRepo extends JpaRepository<StaffProfile, Long> {
    List<StaffProfile> findByActiveTrue();
    List<StaffProfile> findByFullNameContainingIgnoreCase(String name);
    Optional<StaffProfile> findByUsernameIgnoreCase(String username);
}
