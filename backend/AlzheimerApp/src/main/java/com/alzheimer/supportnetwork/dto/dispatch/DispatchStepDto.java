package com.alzheimer.supportnetwork.dto.dispatch;

import java.util.List;

public class DispatchStepDto {
    private int stepNumber;
    private int timeoutMinutes;
    private List<DispatchAssigneeDto> assignees;
    private String note;

    public DispatchStepDto() {}

    public DispatchStepDto(int stepNumber, int timeoutMinutes, List<DispatchAssigneeDto> assignees, String note) {
        this.stepNumber = stepNumber;
        this.timeoutMinutes = timeoutMinutes;
        this.assignees = assignees;
        this.note = note;
    }

    public static Builder builder() {
        return new Builder();
    }

    public int getStepNumber() { return stepNumber; }
    public void setStepNumber(int stepNumber) { this.stepNumber = stepNumber; }
    public int getTimeoutMinutes() { return timeoutMinutes; }
    public void setTimeoutMinutes(int timeoutMinutes) { this.timeoutMinutes = timeoutMinutes; }
    public List<DispatchAssigneeDto> getAssignees() { return assignees; }
    public void setAssignees(List<DispatchAssigneeDto> assignees) { this.assignees = assignees; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public static final class Builder {
        private int stepNumber;
        private int timeoutMinutes;
        private List<DispatchAssigneeDto> assignees;
        private String note;
        public Builder stepNumber(int stepNumber) { this.stepNumber = stepNumber; return this; }
        public Builder timeoutMinutes(int timeoutMinutes) { this.timeoutMinutes = timeoutMinutes; return this; }
        public Builder assignees(List<DispatchAssigneeDto> assignees) { this.assignees = assignees; return this; }
        public Builder note(String note) { this.note = note; return this; }
        public DispatchStepDto build() {
            return new DispatchStepDto(stepNumber, timeoutMinutes, assignees, note);
        }
    }
}
