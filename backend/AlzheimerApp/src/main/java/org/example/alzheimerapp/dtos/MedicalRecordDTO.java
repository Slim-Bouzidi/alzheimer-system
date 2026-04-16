package org.example.alzheimerapp.dtos;

public class MedicalRecordDTO {
    private String diagnosis;
    private String diseaseStage;
    private String medicalHistory;
    private String allergies;
    private String recordDate;
    private Integer patientId;

    public MedicalRecordDTO() {
    }

    public MedicalRecordDTO(String diagnosis, String diseaseStage, String medicalHistory, String allergies, String recordDate, Integer patientId) {
        this.diagnosis = diagnosis;
        this.diseaseStage = diseaseStage;
        this.medicalHistory = medicalHistory;
        this.allergies = allergies;
        this.recordDate = recordDate;
        this.patientId = patientId;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getDiseaseStage() {
        return diseaseStage;
    }

    public void setDiseaseStage(String diseaseStage) {
        this.diseaseStage = diseaseStage;
    }

    public String getMedicalHistory() {
        return medicalHistory;
    }

    public void setMedicalHistory(String medicalHistory) {
        this.medicalHistory = medicalHistory;
    }

    public String getAllergies() {
        return allergies;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }

    public String getRecordDate() {
        return recordDate;
    }

    public void setRecordDate(String recordDate) {
        this.recordDate = recordDate;
    }

    public Integer getPatientId() {
        return patientId;
    }

    public void setPatientId(Integer patientId) {
        this.patientId = patientId;
    }
}
