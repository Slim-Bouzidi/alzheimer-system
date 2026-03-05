package assistancequotidienne2.assistancequotidienne2.Services;

import assistancequotidienne2.assistancequotidienne2.DTOs.DoctorNotificationMessage;
import assistancequotidienne2.assistancequotidienne2.Entities.Notification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationWsService {

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationWsService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyDoctor(Notification notification) {
        if (notification == null || notification.getDestinataire() == null || notification.getDestinataire().getId() == null) {
            return;
        }

        DoctorNotificationMessage payload = new DoctorNotificationMessage(
                notification.getId(),
                notification.getDestinataire().getId(),
                notification.getType(),
                notification.getTitre(),
                notification.getMessage(),
                notification.getReferenceType(),
                notification.getReferenceId(),
                notification.getDateCreation()
        );

        messagingTemplate.convertAndSend("/topic/doctor-notifications", payload);
    }
}
