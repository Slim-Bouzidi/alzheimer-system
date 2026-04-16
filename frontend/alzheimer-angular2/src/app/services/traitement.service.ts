import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Traitement {
  id?: number;
  patient?: any;
  nomMedicament: string;
  dosage?: string;
  frequence?: string;
  momentMatin?: boolean;
  momentMidi?: boolean;
  momentSoir?: boolean;
  momentCoucher?: boolean;
  heurePersonnalisee?: string;
  dateDebut?: string;
  dateFin?: string;
  actif?: boolean;
  nbPrisesPrevues?: number;
  nbPrisesEffectuees?: number;
  tauxObservance?: number;
}

@Injectable({ providedIn: 'root' })
export class TraitementService {
  private baseUrl = `${environment.apiUrl}/traitements`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  getAll(): Observable<Traitement[]> {
    return this.http.get<Traitement[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<Traitement> {
    return this.http.get<Traitement>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  getByPatient(patientId: number): Observable<Traitement[]> {
    return this.http.get<Traitement[]>(`${this.baseUrl}/patient/${patientId}`, { headers: this.getHeaders() });
  }

  create(traitement: Traitement): Observable<Traitement> {
    return this.http.post<Traitement>(this.baseUrl, traitement, { headers: this.getHeaders() });
  }

  update(id: number, traitement: Traitement): Observable<Traitement> {
    return this.http.put<Traitement>(`${this.baseUrl}/${id}`, traitement, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  enregistrerPrise(id: number): Observable<Traitement> {
    return this.http.post<Traitement>(`${this.baseUrl}/${id}/enregistrer-prise`, {}, { headers: this.getHeaders() });
  }
}
