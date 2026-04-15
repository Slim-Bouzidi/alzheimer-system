package com.alzheimer.userservice.repository;

import com.alzheimer.userservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByKeycloakId(String keycloakId);
    
    Optional<User> findByEmail(String email);
    
    boolean existsByKeycloakId(String keycloakId);
    
    boolean existsByEmail(String email);
}
