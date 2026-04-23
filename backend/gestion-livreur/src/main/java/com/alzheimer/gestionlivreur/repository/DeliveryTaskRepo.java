package com.alzheimer.gestionlivreur.repository;

import com.alzheimer.gestionlivreur.entity.DeliveryStatus;
import com.alzheimer.gestionlivreur.entity.DeliveryTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DeliveryTaskRepo extends JpaRepository<DeliveryTask, Long> {
    List<DeliveryTask> findByDeliveryDate(LocalDate date);
    List<DeliveryTask> findByPatientId(Long patientId);
    List<DeliveryTask> findByAssignedStaffId(Long staffId);
    List<DeliveryTask> findByAssignedStaffIdAndDeliveryDate(Long staffId, LocalDate date);
    List<DeliveryTask> findByDeliveryDateAndStatus(LocalDate date, DeliveryStatus status);

    @Modifying
    void deleteByPatientId(Long patientId);
}
