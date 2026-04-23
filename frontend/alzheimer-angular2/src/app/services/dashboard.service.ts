import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { supportNetworkHttpHeaders } from '../core/support-network-headers';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { NetworkDashboard } from '../models/dashboard.model';

const BASE = (environment as { supportNetworkApiUrl?: string }).supportNetworkApiUrl ?? '/api';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = `${BASE}/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<NetworkDashboard> {
    return this.http.get<NetworkDashboard>(`${this.baseUrl}/network`, {
      headers: supportNetworkHttpHeaders(),
    });
  }
}
