import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { supportNetworkHttpHeaders } from '../core/support-network-headers';
import { Mission } from '../models/mission.model';

const BASE = (environment as { supportNetworkApiUrl?: string }).supportNetworkApiUrl ?? '/api';

export interface AlertTriggerPayload {
  patientId: number;
  alertType: string;
  description?: string;
}

/** First assignee shape from POST /api/alerts/trigger (matches DispatchAssigneeDto). */
export interface AlertTriggerAssignee {
  memberId?: number;
  fullName?: string;
  type?: string;
  score?: number;
  reasons?: string[];
}

/** Response from POST /api/alerts/trigger */
export interface AlertTriggerResponse {
  mission?: Mission;
  selectedIntervenant?: AlertTriggerAssignee;
  dispatchPlan?: unknown;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly url = `${BASE}/alerts/trigger`;

  constructor(private http: HttpClient) {}

  triggerAlert(payload: AlertTriggerPayload): Observable<AlertTriggerResponse> {
    return this.http.post<AlertTriggerResponse>(this.url, payload, {
      headers: supportNetworkHttpHeaders(),
    });
  }
}
