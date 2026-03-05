import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { NotificationApiService, NotificationApi } from '../../../services/notification-api.service';
import { DoctorNotificationWsService, DoctorNotificationMessage } from '../../../services/doctor-notification-ws.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  showDropdown = false;
  notifications: NotificationApi[] = [];
  private notifPoll$?: Subscription;
  private notifWs$?: Subscription;
  readonly DOCTOR_USER_ID = 1; // TODO: get from auth service

  constructor(
    private router: Router,
    private notificationService: NotificationApiService,
    private doctorWs: DoctorNotificationWsService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    
    // Poll for new notifications every 30s
    this.notifPoll$ = interval(30000).subscribe(() => this.loadNotifications());

    // Realtime notifications (WebSocket)
    this.doctorWs.connect();
    this.notifWs$ = this.doctorWs.notifications$.subscribe((msg: DoctorNotificationMessage) => {
      const incoming: NotificationApi = {
        id: msg.notificationId,
        type: msg.type,
        titre: msg.titre,
        message: msg.message,
        lu: false,
        referenceType: msg.referenceType,
        referenceId: msg.referenceId,
        dateCreation: msg.dateCreation
      };
      this.notifications = [incoming, ...this.notifications];
      this.unreadCount = this.unreadCount + 1;
    });
  }

  ngOnDestroy(): void {
    this.notifPoll$?.unsubscribe();
    this.notifWs$?.unsubscribe();
    this.doctorWs.disconnect();
  }

  loadNotifications(): void {
    this.notificationService.getUnreadCount(this.DOCTOR_USER_ID).subscribe({
      next: (res) => this.unreadCount = res.count,
      error: () => {}
    });
    
    this.notificationService.getByUser(this.DOCTOR_USER_ID).subscribe({
      next: (data) => this.notifications = data.slice(0, 5), // Show only 5 most recent
      error: () => {}
    });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  markAsRead(notif: NotificationApi, event: Event): void {
    event.stopPropagation();
    if (notif.lu || !notif.id) return;
    
    this.notificationService.marquerLu(notif.id).subscribe({
      next: () => {
        notif.lu = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      },
      error: () => {}
    });
  }

  viewAllNotifications(): void {
    this.showDropdown = false;
    this.router.navigate(['/doctor-reports']);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'FICHE_ENVOYEE':
      case 'FICHE_TRANSMISSION':
        return '📋';
      case 'RAPPORT_HEBDOMADAIRE':
        return '📊';
      case 'ALERTE':
        return '🚨';
      default:
        return '🔔';
    }
  }

  getTimeAgo(date: any): string {
    if (!date) return '';
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays}j`;
  }
}
