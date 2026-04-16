import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { supportNetworkHttpHeaders } from '../core/support-network-headers';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AvailabilitySlot, AvailabilityCreateDto } from '../models/availability.model';

const BASE = (environment as { supportNetworkApiUrl?: string }).supportNetworkApiUrl ?? '/api';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private baseUrl = `${BASE}/availability`;

  constructor(private http: HttpClient) {}

  /** GET /api/availability/member/{memberId} */
  getByMember(memberId: number): Observable<AvailabilitySlot[]> {
    return this.http.get<AvailabilitySlot[]>(
      `${this.baseUrl}/member/${memberId}`,
      { headers: supportNetworkHttpHeaders() }
    );
  }

  /** POST /api/availability */
  create(dto: AvailabilityCreateDto): Observable<AvailabilitySlot> {
    return this.http.post<AvailabilitySlot>(this.baseUrl, dto, {
      headers: supportNetworkHttpHeaders(),
    });
  }

  /** PUT /api/availability/{id} */
  update(id: number, dto: AvailabilityCreateDto): Observable<AvailabilitySlot> {
    return this.http.put<AvailabilitySlot>(`${this.baseUrl}/${id}`, dto, {
      headers: supportNetworkHttpHeaders(),
    });
  }

  /** DELETE /api/availability/{id} */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      headers: supportNetworkHttpHeaders(),
    });
  }
}
