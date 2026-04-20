import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MedicalRecord {
  idRecord?: number;
  diagnosis: string;
  diseaseStage: string;
  medicalHistory: string;
  allergies: string;
  recordDate?: string;
  lastUpdate?: string;
  patient?: {
    idPatient: number;
  };
}

export interface MedicalRecordDTO {
  diagnosis: string;
  diseaseStage: string;
  medicalHistory: string;
  allergies: string;
  recordDate?: string;
  patientId: number;
}

@Injectable({ providedIn: 'root' })
export class MedicalRecordService {
  private baseUrl = `${environment.apiUrl}/medicalRecord`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  create(record: MedicalRecord): Observable<MedicalRecord> {
    return this.http.post<MedicalRecord>(
      `${this.baseUrl}/addMedicalRecord`,
      record,
      { headers: this.getHeaders() }
    );
  }

  createFromDTO(dto: MedicalRecordDTO): Observable<MedicalRecord> {
    return this.http.post<MedicalRecord>(
      `${this.baseUrl}/addMedicalRecord`,
      dto,
      { headers: this.getHeaders() }
    );
  }

  update(record: MedicalRecord): Observable<MedicalRecord> {
    return this.http.put<MedicalRecord>(
      `${this.baseUrl}/update`,
      record,
      { headers: this.getHeaders() }
    );
  }

  delete(recordId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/delete/${recordId}`,
      { headers: this.getHeaders() }
    );
  }
}
