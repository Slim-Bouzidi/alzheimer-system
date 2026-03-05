package assistancequotidienne2.assistancequotidienne2.DTOs;

import java.time.LocalDateTime;

public class DoctorNotificationMessage {
    private Long notificationId;
    private Long destinataireId;
    private String type;
    private String titre;
    private String message;
    private String referenceType;
    private Long referenceId;
    private LocalDateTime dateCreation;

    public DoctorNotificationMessage() {
    }

    public DoctorNotificationMessage(Long notificationId, Long destinataireId, String type, String titre, String message,
                                    String referenceType, Long referenceId, LocalDateTime dateCreation) {
        this.notificationId = notificationId;
        this.destinataireId = destinataireId;
        this.type = type;
        this.titre = titre;
        this.message = message;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.dateCreation = dateCreation;
    }

    public Long getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(Long notificationId) {
        this.notificationId = notificationId;
    }

    public Long getDestinataireId() {
        return destinataireId;
    }

    public void setDestinataireId(Long destinataireId) {
        this.destinataireId = destinataireId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public Long getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Long referenceId) {
        this.referenceId = referenceId;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
}
