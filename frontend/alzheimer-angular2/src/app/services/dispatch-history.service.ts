import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { supportNetworkHttpHeaders } from '../core/support-network-headers';
import { DispatchHistoryDetail, DispatchHistoryItem } from '../models/dispatch-history.model';

const BASE = (environment as { supportNetworkApiUrl?: string }).supportNetworkApiUrl ?? '/api';

@Injectable({ providedIn: 'root' })
export class DispatchHistoryService {
  private readonly root = `${BASE}/dispatch/history`;

  constructor(private http: HttpClient) {}

  getDispatchHistoryForPatient(patientId: number): Observable<DispatchHistoryItem[]> {
    return this.http.get<DispatchHistoryItem[]>(`${this.root}/patient/${patientId}`, {
      headers: supportNetworkHttpHeaders(),
    });
  }

  getDispatchHistoryDetail(dispatchId: number): Observable<DispatchHistoryDetail> {
    return this.http.get<DispatchHistoryDetail>(`${this.root}/${dispatchId}`, {
      headers: supportNetworkHttpHeaders(),
    });
  }
}
