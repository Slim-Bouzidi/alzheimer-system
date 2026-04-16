import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Treatment {
  idTreatment?: number;
  treatmentName: string;
  dosage: string;
  frequency: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  patient?: {
    idPatient: number;
  };
}

export interface TreatmentDTO {
  treatmentName: string;
  dosage: string;
  frequency: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  patientId: number;
}

@Injectable({ providedIn: 'root' })
export class TreatmentService {
  private baseUrl = `${environment.apiUrl}/treatment`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  create(treatment: Treatment): Observable<Treatment> {
    return this.http.post<Treatment>(
      `${this.baseUrl}/addTreatment`,
      treatment,
      { headers: this.getHeaders() }
    );
  }

  createFromDTO(dto: TreatmentDTO): Observable<Treatment> {
    return this.http.post<Treatment>(
      `${this.baseUrl}/addTreatment`,
      dto,
      { headers: this.getHeaders() }
    );
  }

  update(treatment: Treatment): Observable<Treatment> {
    return this.http.put<Treatment>(
      `${this.baseUrl}/update`,
      treatment,
      { headers: this.getHeaders() }
    );
  }

  delete(treatmentId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/delete/${treatmentId}`,
      { headers: this.getHeaders() }
    );
  }
}
