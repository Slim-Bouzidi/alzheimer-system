import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Rapport {
  id?: number;
  patient?: any;
  soignant?: any;
  typeRapport?: string;
  periodeDebut?: string;
  periodeFin?: string;
  titre?: string;
  contenuTexte?: string;
  nbAlertes?: number;
  nbInterventions?: number;
  tauxObservance?: number;
  qualiteSommeil?: number;
  nbComportementsAnormaux?: number;
  directives?: string;
  recommandations?: string;
  formatExport?: string;
  cheminFichier?: string;
  statut?: string;
  dateGeneration?: string;
}

@Injectable({ providedIn: 'root' })
export class RapportService {
  private baseUrl = `${environment.apiUrl}/rapports`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  getAll(): Observable<Rapport[]> {
    return this.http.get<Rapport[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<Rapport> {
    return this.http.get<Rapport>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  getByPatient(patientId: number): Observable<Rapport[]> {
    return this.http.get<Rapport[]>(`${this.baseUrl}/patient/${patientId}`, { headers: this.getHeaders() });
  }

  create(rapport: Rapport): Observable<Rapport> {
    return this.http.post<Rapport>(this.baseUrl, rapport, { headers: this.getHeaders() });
  }

  update(id: number, rapport: Rapport): Observable<Rapport> {
    return this.http.put<Rapport>(`${this.baseUrl}/${id}`, rapport, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  envoyer(id: number): Observable<Rapport> {
    return this.http.patch<Rapport>(`${this.baseUrl}/${id}/envoyer`, {}, { headers: this.getHeaders() });
  }
}
