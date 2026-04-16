package org.example.alzheimerapp.repositories;

import org.example.alzheimerapp.entities.EmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Integer> {
}
