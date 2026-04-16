package com.alzheimer.supportnetwork.config;

import com.alzheimer.supportnetwork.entity.MemberSkill;
import com.alzheimer.supportnetwork.entity.Skill;
import com.alzheimer.supportnetwork.entity.SupportMember;
import com.alzheimer.supportnetwork.repository.MemberSkillRepository;
import com.alzheimer.supportnetwork.repository.SkillRepository;
import com.alzheimer.supportnetwork.repository.SupportMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Idempotent seed: default skills and optional rotation of one skill per member without skills.
 */
@Component
@Order(100)
public class SkillsDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SkillsDataInitializer.class);

    private static final List<String> DEFAULT_SKILL_NAMES = List.of(
            "DOCTOR", "NURSE", "CAREGIVER", "FAMILY", "VOLUNTEER");

    private final SkillRepository skillRepository;
    private final MemberSkillRepository memberSkillRepository;
    private final SupportMemberRepository supportMemberRepository;

    public SkillsDataInitializer(
            SkillRepository skillRepository,
            MemberSkillRepository memberSkillRepository,
            SupportMemberRepository supportMemberRepository) {
        this.skillRepository = skillRepository;
        this.memberSkillRepository = memberSkillRepository;
        this.supportMemberRepository = supportMemberRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        Map<String, Skill> skills = new LinkedHashMap<>();
        for (String name : DEFAULT_SKILL_NAMES) {
            Skill s = skillRepository.findByName(name)
                    .orElseGet(() -> skillRepository.save(Skill.builder().name(name).build()));
            skills.put(name, s);
        }
        log.info("[Skills] Default skills ready: {}", skills.keySet());

        List<SupportMember> members = supportMemberRepository.findAll();
        String[] cycle = {"DOCTOR", "NURSE", "CAREGIVER", "FAMILY"};
        int assigned = 0;
        for (int i = 0; i < members.size(); i++) {
            SupportMember m = members.get(i);
            if (m.getId() == null) {
                continue;
            }
            if (!memberSkillRepository.findByMember_Id(m.getId()).isEmpty()) {
                continue;
            }
            String skillName = cycle[i % cycle.length];
            Skill skill = skills.get(skillName);
            if (skill != null) {
                memberSkillRepository.save(MemberSkill.builder().member(m).skill(skill).build());
                assigned++;
            }
        }
        if (assigned > 0) {
            log.info("[Skills] Assigned one default skill to {} member(s) without skills", assigned);
        }
    }
}
