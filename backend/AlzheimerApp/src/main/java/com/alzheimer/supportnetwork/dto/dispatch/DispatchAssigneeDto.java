package com.alzheimer.supportnetwork.dto.dispatch;

import java.util.List;

public class DispatchAssigneeDto {
    private Long memberId;
    private String fullName;
    private String type;
    private int score;
    private List<String> reasons;

    public DispatchAssigneeDto() {}

    public DispatchAssigneeDto(Long memberId, String fullName, String type, int score, List<String> reasons) {
        this.memberId = memberId;
        this.fullName = fullName;
        this.type = type;
        this.score = score;
        this.reasons = reasons;
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

    public static final class Builder {
        private Long memberId;
        private String fullName;
        private String type;
        private int score;
        private List<String> reasons;
        public Builder memberId(Long memberId) { this.memberId = memberId; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder type(String type) { this.type = type; return this; }
        public Builder score(int score) { this.score = score; return this; }
        public Builder reasons(List<String> reasons) { this.reasons = reasons; return this; }
        public DispatchAssigneeDto build() {
            return new DispatchAssigneeDto(memberId, fullName, type, score, reasons);
        }
    }
}
