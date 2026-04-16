package com.alzheimer.supportnetwork.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientSupportLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String roleInNetwork;

    private String trustLevel;

    private int priorityRank;

    @ElementCollection(fetch = FetchType.EAGER)
    private Set<String> permissions;

    private boolean canAccessHome;

    private LocalDateTime startAt;
    private LocalDateTime endAt;

    @ManyToOne
    private Patient patient;

    @ManyToOne
    private SupportMember member;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRoleInNetwork() { return roleInNetwork; }
    public void setRoleInNetwork(String roleInNetwork) { this.roleInNetwork = roleInNetwork; }
    public String getTrustLevel() { return trustLevel; }
    public void setTrustLevel(String trustLevel) { this.trustLevel = trustLevel; }
    public int getPriorityRank() { return priorityRank; }
    public void setPriorityRank(int priorityRank) { this.priorityRank = priorityRank; }
    public Set<String> getPermissions() { return permissions; }
    public void setPermissions(Set<String> permissions) { this.permissions = permissions; }
    public boolean isCanAccessHome() { return canAccessHome; }
    public void setCanAccessHome(boolean canAccessHome) { this.canAccessHome = canAccessHome; }
    public LocalDateTime getStartAt() { return startAt; }
    public void setStartAt(LocalDateTime startAt) { this.startAt = startAt; }
    public LocalDateTime getEndAt() { return endAt; }
    public void setEndAt(LocalDateTime endAt) { this.endAt = endAt; }
    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
    public SupportMember getMember() { return member; }
    public void setMember(SupportMember member) { this.member = member; }
}
