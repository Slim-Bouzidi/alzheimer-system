package com.alzheimer.supportnetwork.repository;

import com.alzheimer.supportnetwork.entity.SupportMember;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportMemberRepository extends JpaRepository<SupportMember, Long> {
}
