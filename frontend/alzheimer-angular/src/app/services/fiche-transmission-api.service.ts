import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FicheTransmissionApiService {
  private baseUrl = `${environment.apiUrl}/fiches`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  getByPatient(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/patient/${patientId}`, { headers: this.getHeaders() });
  }

  getByPatientAndDate(patientId: number, date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/patient/${patientId}/date/${date}`, { headers: this.getHeaders() });
  }

  getByPatientAndPeriode(patientId: number, debut: string, fin: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/patient/${patientId}/periode?debut=${debut}&fin=${fin}`, { headers: this.getHeaders() });
  }

  create(fiche: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, fiche, { headers: this.getHeaders() });
  }

  update(id: number, fiche: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, fiche, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  marquerEnvoye(id: number): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/envoyer`, {}, { headers: this.getHeaders() });
  }
}
