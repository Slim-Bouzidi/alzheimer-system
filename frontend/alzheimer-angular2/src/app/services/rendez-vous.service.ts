import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RendezVous {
  id?: number;
  patient?: any;
  soignant?: any;
  titre?: string;
  description?: string;
  type?: string;        // maps to typeRdv in back-end
  typeRdv?: string;     // back-end field name
  statut?: string;
  lieu?: string;
  motif?: string;
  notes?: string;
  duree?: number;
  dureeMinutes?: number; // back-end field name
  envoyerRappel?: boolean;
  rappelEnvoye?: boolean;
  dateHeure?: string;
  telephone?: string;
  createdAt?: string;
}

export interface Patient {
  id?: number;
  nomComplet: string;
  dateNaissance?: string;
  adresse?: string;
  numeroDeTelephone?: string;
  antecedents?: string;
  allergies?: string;
  nbInterventionsMois?: number;
  derniereVisite?: string;
  actif?: boolean;
  // Champs additionnels pour compatibilité avec le frontend existant
  nom?: string;
  prenom?: string;
  age?: number;
  gender?: string;
  condition?: string;
  lastVisit?: string;
  status?: string;
  telephone?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RendezVousService {
  private apiUrl = `${environment.apiUrl}/rendez-vous`;

  constructor(private http: HttpClient) {}

  // Headers pour les requêtes
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  // CRUD Operations

  // Lire tous les rendez-vous
  getAll(): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // Lire un rendez-vous par ID
  getById(id: number): Observable<RendezVous> {
    return this.http.get<RendezVous>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Créer un nouveau rendez-vous
  create(rendezVous: RendezVous): Observable<RendezVous> {
    return this.http.post<RendezVous>(this.apiUrl, rendezVous, { headers: this.getHeaders() });
  }

  // Mettre à jour un rendez-vous
  update(id: number, rendezVous: RendezVous): Observable<RendezVous> {
    return this.http.put<RendezVous>(`${this.apiUrl}/${id}`, rendezVous, { headers: this.getHeaders() });
  }

  // Supprimer un rendez-vous
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Méthodes supplémentaires utiles

  // Obtenir les rendez-vous d'un patient
  getByPatient(patientId: number): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.apiUrl}/patient/${patientId}`, { headers: this.getHeaders() });
  }

  // Obtenir les rendez-vous par date
  getByDate(date: string): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.apiUrl}/date/${date}`, { headers: this.getHeaders() });
  }

  // Obtenir les rendez-vous entre deux dates
  getByDateRange(dateDebut: string, dateFin: string): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.apiUrl}/periode?debut=${dateDebut}&fin=${dateFin}`, { headers: this.getHeaders() });
  }

  // Confirmer un rendez-vous
  confirmer(id: number): Observable<RendezVous> {
    return this.http.put<RendezVous>(`${this.apiUrl}/${id}/confirmer`, {}, { headers: this.getHeaders() });
  }

  // Annuler un rendez-vous
  annuler(id: number): Observable<RendezVous> {
    return this.http.put<RendezVous>(`${this.apiUrl}/${id}/annuler`, {}, { headers: this.getHeaders() });
  }

  // Obtenir les patients disponibles
  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl.replace('/rendez-vous', '')}/patients`, { headers: this.getHeaders() });
  }
}
