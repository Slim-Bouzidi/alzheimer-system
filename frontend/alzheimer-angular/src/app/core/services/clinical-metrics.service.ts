import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import keycloak from '../../keycloak';

export interface ClinicalRecord {
  id?: number;
  patientId: number;
  bmi: number;
  systolicBP: number;
  diastolicBP: number;
  heartRate: number;
  bloodSugar: number;
  cholesterolTotal: number;
  smokingStatus: string;
  alcoholConsumption: string;
  physicalActivity: number;
  dietQuality: number;
  sleepQuality: number;
  familyHistory: boolean;
  diabetes: boolean;
  hypertension: boolean;
  recordedBy?: string;
  recordedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClinicalMetricsService {
  private apiUrl = 'http://localhost:8080/api/clinical-records';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-User-Id': keycloak.subject || ''
    });
  }

  create(record: ClinicalRecord): Observable<ClinicalRecord> {
    return this.http.post<ClinicalRecord>(this.apiUrl, record, { headers: this.getHeaders() });
  }

  findByPatientId(patientId: number): Observable<ClinicalRecord[]> {
    return this.http.get<ClinicalRecord[]>(`${this.apiUrl}/patient/${patientId}`, { headers: this.getHeaders() });
  }

  getMyRecords(): Observable<ClinicalRecord[]> {
    return this.http.get<ClinicalRecord[]>(`${this.apiUrl}/me`, { headers: this.getHeaders() });
  }

  update(id: number, record: ClinicalRecord): Observable<ClinicalRecord> {
    return this.http.put<ClinicalRecord>(`${this.apiUrl}/${id}`, record, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
