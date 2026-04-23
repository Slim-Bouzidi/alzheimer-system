import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { supportNetworkHttpHeaders } from '../core/support-network-headers';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  NetworkPatient,
  PatientSupportLink,
  LinkCreateDto,
  SupportNetworkPatientUpdateDto,
} from '../models/patient-network.model';

const BASE = (environment as { supportNetworkApiUrl?: string }).supportNetworkApiUrl ?? '/api';

@Injectable({ providedIn: 'root' })
export class PatientSupportLinkService {
  private api = BASE;

  constructor(private http: HttpClient) {}

  /** GET /api/support-patients - list patients (support-network backend) */
  getPatients(): Observable<NetworkPatient[]> {
    return this.http.get<NetworkPatient[]>(`${this.api}/support-patients`, {
      headers: supportNetworkHttpHeaders(),
    });
  }

  /** PUT /api/support-patients/{id} — update name, zone, WGS84 coordinates (for distance ranking). */
  updatePatient(id: number, body: SupportNetworkPatientUpdateDto): Observable<NetworkPatient> {
    return this.http.put<NetworkPatient>(`${this.api}/support-patients/${id}`, body, {
      headers: supportNetworkHttpHeaders(),
    });
  }

  /** GET /api/network/patient/{patientId} - links for patient */
  getLinksByPatient(patientId: number): Observable<PatientSupportLink[]> {
    return this.http.get<PatientSupportLink[]>(
      `${this.api}/network/patient/${patientId}`,
      { headers: supportNetworkHttpHeaders() }
    );
  }

  /** POST /api/network/link - create link (body: LinkCreateDto) */
  createLink(dto: LinkCreateDto): Observable<PatientSupportLink> {
    return this.http.post<PatientSupportLink>(
      `${this.api}/network/link`,
      dto,
      { headers: supportNetworkHttpHeaders() }
    );
  }

  /** PUT /api/network/{linkId} - update link (body: same LinkCreateDto as create) */
  updateLink(linkId: number, dto: LinkCreateDto): Observable<PatientSupportLink> {
    return this.http.put<PatientSupportLink>(
      `${this.api}/network/${linkId}`,
      dto,
      { headers: supportNetworkHttpHeaders() }
    );
  }

  /** DELETE /api/network/{linkId} */
  deleteLink(linkId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/network/${linkId}`, {
      headers: supportNetworkHttpHeaders(),
    });
  }
}
