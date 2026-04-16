package com.alzheimer.supportnetwork.repository;

import com.alzheimer.supportnetwork.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SkillRepository extends JpaRepository<Skill, Long> {

    Optional<Skill> findByName(String name);

    Optional<Skill> findByNameIgnoreCase(String name);
}
