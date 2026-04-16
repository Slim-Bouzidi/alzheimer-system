package com.alzheimer.supportnetwork.repository;

import com.alzheimer.supportnetwork.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    long countByMemberIdAndReadFlagFalse(Long memberId);
}
