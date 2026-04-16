package com.alzheimer.supportnetwork.repository;

import com.alzheimer.supportnetwork.entity.MemberSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MemberSkillRepository extends JpaRepository<MemberSkill, Long> {

    List<MemberSkill> findByMember_Id(Long memberId);

    List<MemberSkill> findBySkill_Name(String name);

    List<MemberSkill> findByMember_IdIn(Collection<Long> memberIds);

    void deleteByMember_Id(Long memberId);
}
