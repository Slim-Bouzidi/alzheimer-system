package com.alzheimer.supportnetwork.dto.engine;

import java.util.ArrayList;
import java.util.List;

public class RankedIntervenantDto {
    private Long memberId;
    private String fullName;
    private String type;
    private int score;
    private List<String> reasons;
    private Boolean availableNow;
    /** Mean intervention report rating (1–5) when {@code totalRatings > 0} on the member; otherwise null. */
    private Double averageRating;
    /** Skill names linked to the member (e.g. DOCTOR, NURSE). */
    private List<String> skills;
    /** Great-circle distance to patient in km when both have coordinates; otherwise null. */
    private Double distanceKm;

    public RankedIntervenantDto() {}

    public RankedIntervenantDto(
            Long memberId,
            String fullName,
            String type,
            int score,
            List<String> reasons,
            Boolean availableNow,
            Double averageRating,
            List<String> skills,
            Double distanceKm) {
        this.memberId = memberId;
        this.fullName = fullName;
        this.type = type;
        this.score = score;
        this.reasons = reasons;
        this.availableNow = availableNow;
        this.averageRating = averageRating;
        this.skills = skills;
        this.distanceKm = distanceKm;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getMemberId() { return memberId; }
    public void setMemberId(Long memberId) { this.memberId = memberId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public List<String> getReasons() { return reasons; }
    public void setReasons(List<String> reasons) { this.reasons = reasons; }
    public Boolean getAvailableNow() { return availableNow; }
    public void setAvailableNow(Boolean availableNow) { this.availableNow = availableNow; }
    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }
    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }
    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public static final class Builder {
        private Long memberId;
        private String fullName;
        private String type;
        private int score;
        private List<String> reasons;
        private Boolean availableNow;
        private Double averageRating;
        private List<String> skills;
        private Double distanceKm;
        public Builder memberId(Long memberId) { this.memberId = memberId; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder type(String type) { this.type = type; return this; }
        public Builder score(int score) { this.score = score; return this; }
        public Builder reasons(List<String> reasons) { this.reasons = reasons; return this; }
        public Builder availableNow(Boolean availableNow) { this.availableNow = availableNow; return this; }
        public Builder averageRating(Double averageRating) { this.averageRating = averageRating; return this; }
        public Builder skills(List<String> skills) { this.skills = skills; return this; }
        public Builder distanceKm(Double distanceKm) { this.distanceKm = distanceKm; return this; }
        public RankedIntervenantDto build() {
            List<String> r = reasons != null ? reasons : new ArrayList<>();
            List<String> s = skills != null ? skills : new ArrayList<>();
            return new RankedIntervenantDto(memberId, fullName, type, score, r, availableNow, averageRating, s, distanceKm);
        }
    }
}
