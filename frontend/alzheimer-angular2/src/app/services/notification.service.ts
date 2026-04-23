import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { supportNetworkHttpHeaders } from '../core/support-network-headers';
import { environment } from '../../environments/environment';
import { SupportNotification } from '../models/support-notification.model';

const BASE = (environment as { supportNetworkApiUrl?: string }).supportNetworkApiUrl ?? '/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly baseUrl = `${BASE}/notifications`;

  constructor(private http: HttpClient) {}

  getMemberNotifications(memberId: number): Observable<SupportNotification[]> {
    return this.http.get<SupportNotification[]>(`${this.baseUrl}/${memberId}`, {
      headers: supportNetworkHttpHeaders(),
    });
  }

  markAsRead(id: number): Observable<SupportNotification> {
    return this.http.patch<SupportNotification>(`${this.baseUrl}/${id}/read`, {}, {
      headers: supportNetworkHttpHeaders(),
    });
  }

  getUnreadCount(memberId: number): Observable<{ memberId: number; unreadCount: number }> {
    return this.http.get<{ memberId: number; unreadCount: number }>(`${this.baseUrl}/unread-count/${memberId}`, {
      headers: supportNetworkHttpHeaders(),
    });
  }
}
