import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { supportNetworkHttpHeaders } from '../core/support-network-headers';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Mission } from '../models/mission.model';
import { MissionDispatchRequest } from '../models/mission-dispatch-request.model';
import { MissionTimelineEvent } from '../models/mission-timeline-event.model';

const BASE = (environment as { supportNetworkApiUrl?: string }).supportNetworkApiUrl ?? '/api';

@Injectable({ providedIn: 'root' })
export class MissionService {
  private readonly baseUrl = `${BASE}/missions`;

  constructor(private http: HttpClient) {}

  dispatchMission(payload: MissionDispatchRequest): Observable<Mission> {
    console.log('Calling API:', `${this.baseUrl}/dispatch`);
    return this.http.post<Mission>(`${this.baseUrl}/dispatch`, payload, {
      headers: supportNetworkHttpHeaders(),
    });
  }

  getMyMissions(memberId: number): Observable<Mission[]> {
    console.log('Calling API:', `${this.baseUrl}/my/${memberId}`);
    return this.http.get<Mission[]>(`${this.baseUrl}/my/${memberId}`, {
      headers: supportNetworkHttpHeaders(),
    });
  }

  acceptMission(missionId: number): Observable<Mission> {
    console.log('Calling API:', `${this.baseUrl}/${missionId}/accept`);
    return this.http.patch<Mission>(`${this.baseUrl}/${missionId}/accept`, {}, {
      headers: supportNetworkHttpHeaders(),
    });
  }

  completeMission(missionId: number): Observable<Mission> {
    console.log('Calling API:', `${this.baseUrl}/${missionId}/complete`);
    return this.http.patch<Mission>(`${this.baseUrl}/${missionId}/complete`, {}, {
      headers: supportNetworkHttpHeaders(),
    });
  }

  getTimeline(missionId: number): Observable<MissionTimelineEvent[]> {
    console.log('Calling API:', `${this.baseUrl}/${missionId}/timeline`);
    return this.http.get<MissionTimelineEvent[]>(`${this.baseUrl}/${missionId}/timeline`, {
      headers: supportNetworkHttpHeaders(),
    });
  }
}
