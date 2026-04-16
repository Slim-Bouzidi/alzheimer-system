package com.assistance.assistanceQuotidienne2.repository;

import com.assistance.assistanceQuotidienne2.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    
    // Rechercher par nom complet (contient)
    @Query("SELECT p FROM Patient p WHERE p.nomComplet LIKE %:nom%")
    List<Patient> findByNomCompletContaining(@Param("nom") String nom);
    
    // Rechercher par téléphone
    @Query("SELECT p FROM Patient p WHERE p.numeroDeTelephone = :telephone")
    Optional<Patient> findByNumeroDeTelephone(@Param("telephone") String telephone);
    
    // Rechercher les patients actifs
    @Query("SELECT p FROM Patient p WHERE p.actif = true")
    List<Patient> findByActifTrue();
    
    // Rechercher par condition (si vous ajoutez ce champ)
    // @Query("SELECT p FROM Patient p WHERE p.condition LIKE %:condition%")
    // List<Patient> findByConditionContaining(@Param("condition") String condition);
    
    // Compter les interventions du mois pour un patient
    @Query("SELECT COUNT(r) FROM RendezVous r WHERE r.patient.id = :patientId AND MONTH(r.dateHeure) = MONTH(CURRENT_DATE) AND YEAR(r.dateHeure) = YEAR(CURRENT_DATE)")
    Long countInterventionsMois(@Param("patientId") Long patientId);
}
