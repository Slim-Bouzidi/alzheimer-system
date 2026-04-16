package org.example.alzheimerapp.dtos;

public class EmergencyContactDTO {
    private String fullName;
    private String relationship;
    private String phone;
    private String email;
    private Integer patientId;

    public EmergencyContactDTO() {
    }

    public EmergencyContactDTO(String fullName, String relationship, String phone, String email, Integer patientId) {
        this.fullName = fullName;
        this.relationship = relationship;
        this.phone = phone;
        this.email = email;
        this.patientId = patientId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRelationship() {
        return relationship;
    }

    public void setRelationship(String relationship) {
        this.relationship = relationship;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getPatientId() {
        return patientId;
    }

    public void setPatientId(Integer patientId) {
        this.patientId = patientId;
    }
}
