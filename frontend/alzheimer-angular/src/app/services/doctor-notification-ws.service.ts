import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DoctorNotificationMessage {
  notificationId?: number;
  destinataireId?: number;
  type?: string;
  titre?: string;
  message?: string;
  referenceType?: string;
  referenceId?: number;
  dateCreation?: string;
}

@Injectable({ providedIn: 'root' })
export class DoctorNotificationWsService {
  private client?: Client;
  private subscription?: StompSubscription;
  private readonly notificationsSubject = new Subject<DoctorNotificationMessage>();

  notifications$: Observable<DoctorNotificationMessage> = this.notificationsSubject.asObservable();

  connect(): void {
    if (this.client?.active) return;

    const wsUrl = environment.apiUrl.replace(/\/api\/?$/, '') + '/ws';

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {}
    });

    this.client.onConnect = () => {
      this.subscription?.unsubscribe();
      this.subscription = this.client?.subscribe('/topic/doctor-notifications', (msg: IMessage) => {
        try {
          const payload = JSON.parse(msg.body);
          this.notificationsSubject.next(payload);
        } catch {
          this.notificationsSubject.next({ message: msg.body });
        }
      });
    };

    this.client.onStompError = () => {
      // handled by reconnectDelay
    };

    this.client.activate();
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;

    if (this.client?.active) {
      this.client.deactivate();
    }
    this.client = undefined;
  }
}
