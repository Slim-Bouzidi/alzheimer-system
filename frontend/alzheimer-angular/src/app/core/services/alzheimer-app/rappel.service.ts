import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Rappel {
  id?: number;
  patient?: any;
  typeRappel?: string;
  titre?: string;
  description?: string;
  heureRappel?: string;
  joursSemaine?: string;
  frequence?: string;
  dateDebut?: string;
  dateFin?: string;
  actif?: boolean;
  traitement?: any;
  derniereNotification?: string;
}

@Injectable({ providedIn: 'root' })
export class RappelService {
  private baseUrl = `${environment.apiUrl}/rappels`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  getAll(): Observable<Rappel[]> {
    return this.http.get<Rappel[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<Rappel> {
    return this.http.get<Rappel>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  getByPatient(patientId: number): Observable<Rappel[]> {
    return this.http.get<Rappel[]>(`${this.baseUrl}/patient/${patientId}`, { headers: this.getHeaders() });
  }

  getActifs(): Observable<Rappel[]> {
    return this.http.get<Rappel[]>(`${this.baseUrl}/actifs`, { headers: this.getHeaders() });
  }

  create(rappel: Rappel): Observable<Rappel> {
    return this.http.post<Rappel>(this.baseUrl, rappel, { headers: this.getHeaders() });
  }

  update(id: number, rappel: Rappel): Observable<Rappel> {
    return this.http.put<Rappel>(`${this.baseUrl}/${id}`, rappel, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  marquerEnvoye(id: number): Observable<Rappel> {
    return this.http.post<Rappel>(`${this.baseUrl}/${id}/marquer-envoye`, {}, { headers: this.getHeaders() });
  }
}
