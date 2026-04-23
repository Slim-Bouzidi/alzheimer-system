import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { supportNetworkHttpHeaders } from '../core/support-network-headers';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SupportMember } from '../models/support-member.model';

/** Base path for members API. Must be relative '/api' when using proxy (ng serve), so requests go to same origin and proxy forwards to backend. */
const MEMBERS_API_BASE = (environment as { supportNetworkApiUrl?: string }).supportNetworkApiUrl ?? '/api';

/** Request body for POST /api/members - must match backend SupportMember fields (camelCase) */
export interface CreateMemberBody {
  fullName: string;
  phone?: string;
  email?: string;
  type: string;
  locationZone?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  skills?: string[];
}

@Injectable({ providedIn: 'root' })
export class MembersService {
  /** Support-network members are always accessed through the gateway-relative /api surface. */
  private baseUrl = `${MEMBERS_API_BASE}/members`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SupportMember[]> {
    return this.http.get<SupportMember[]>(this.baseUrl, { headers: supportNetworkHttpHeaders() });
  }

  create(member: SupportMember): Observable<SupportMember> {
    const body: CreateMemberBody = {
      fullName: member.fullName ?? '',
      type: member.type ?? '',
      phone: member.phone || undefined,
      email: member.email?.trim() || undefined,
      locationZone: member.locationZone || undefined,
      latitude: member.latitude,
      longitude: member.longitude,
      notes: member.notes || undefined,
      skills: member.skills?.length ? [...member.skills] : undefined,
    };
    return this.http.post<SupportMember>(this.baseUrl, body, { headers: supportNetworkHttpHeaders() });
  }

  update(id: number, member: SupportMember): Observable<SupportMember> {
    const body: CreateMemberBody = {
      fullName: member.fullName ?? '',
      type: member.type ?? '',
      phone: member.phone || undefined,
      email: member.email?.trim() || undefined,
      locationZone: member.locationZone || undefined,
      latitude: member.latitude,
      longitude: member.longitude,
      notes: member.notes || undefined,
      skills: member.skills != null ? [...member.skills] : undefined,
    };
    return this.http.put<SupportMember>(`${this.baseUrl}/${id}`, body, { headers: supportNetworkHttpHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: supportNetworkHttpHeaders() });
  }
}
