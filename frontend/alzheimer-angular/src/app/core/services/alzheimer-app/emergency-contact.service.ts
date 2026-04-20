import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface EmergencyContact {
  idContact?: number;
  fullName: string;
  relationship: string;
  phone: string;
  email: string;
  patient: {
    idPatient: number;
  };
}

export interface EmergencyContactDTO {
  fullName: string | null;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  patientId: number;
}

@Injectable({ providedIn: 'root' })
export class EmergencyContactService {
  private baseUrl = `${environment.apiUrl}/emergencyContact`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  create(contact: EmergencyContact): Observable<EmergencyContact> {
    return this.http.post<EmergencyContact>(
      `${this.baseUrl}/addEmergencyContact`,
      contact,
      { headers: this.getHeaders() }
    );
  }

  createFromDTO(dto: EmergencyContactDTO): Observable<EmergencyContact> {
    return this.http.post<EmergencyContact>(
      `${this.baseUrl}/addEmergencyContact`,
      dto,
      { headers: this.getHeaders() }
    );
  }

  update(contact: EmergencyContact): Observable<EmergencyContact> {
    return this.http.put<EmergencyContact>(
      `${this.baseUrl}/update`,
      contact,
      { headers: this.getHeaders() }
    );
  }

  delete(contactId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/delete/${contactId}`,
      { headers: this.getHeaders() }
    );
  }
}

