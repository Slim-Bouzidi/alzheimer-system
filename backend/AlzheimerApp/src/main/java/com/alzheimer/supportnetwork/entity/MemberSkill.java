package com.alzheimer.supportnetwork.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "member_skills",
        uniqueConstraints = @UniqueConstraint(name = "uk_member_skill", columnNames = {"member_id", "skill_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private SupportMember member;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;
}
