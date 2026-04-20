import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subject, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Patient {
  id?: number;
  idPatient?: number;
  nomComplet?: string;
  dateNaissance?: string; // "YYYY-MM-DD"
  adresse?: string;
  numeroDeTelephone?: string;
  antecedents?: string;
  allergies?: string;
  nbInterventionsMois?: number;
  derniereVisite?: string; // "YYYY-MM-DD"
  actif?: boolean;
  soignant?: { id?: number; nom?: string; email?: string; role?: string; telephone?: string };
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
  // Backend field names
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  familyHistoryAlzheimer?: boolean;
  soignantId?: number | null;
  // Relations from backend
  emergencyContacts?: any[];
  medicalRecords?: any[];
  treatments?: any[];
  showStatusDropdown?: boolean;

  // AI Risk Scoring
  riskScore?: number;
  riskLevel?: string;
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  // Aligne l'URL avec le backend Spring Boot (/api/patient/...)
  private baseUrl = `${environment.apiUrl}/patient`;
  private readonly refreshSubject = new Subject<void>();
  readonly refresh$ = this.refreshSubject.asObservable();

  constructor(private http: HttpClient) { }

  triggerRefresh(): void {
    this.refreshSubject.next();
  }

  // Headers pour les requêtes
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  // CRUD Operations

  // Lire tous les patients
  getAll(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/allPatient`, {
      headers: this.getHeaders()
    });
  }

  // Lire un patient par ID
  getById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Créer un nouveau patient (objet adapté au backend Spring)
  create(patient: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/addPatient`, patient, {
      headers: this.getHeaders()
    }).pipe(tap(() => this.triggerRefresh()));
  }

  // Mettre à jour un patient
  update(id: number, patient: Partial<Patient> | Record<string, any>): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/update`, patient, { headers: this.getHeaders() })
      .pipe(tap(() => this.triggerRefresh()));
  }

  // Supprimer un patient
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`, { headers: this.getHeaders() })
      .pipe(tap(() => this.triggerRefresh()));
  }

  // Méthodes supplémentaires utiles

  // Rechercher des patients par nom
  searchByName(nom: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/search?nom=${nom}`, { headers: this.getHeaders() });
  }

  // Obtenir les patients actifs
  getActivePatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/actifs`, { headers: this.getHeaders() });
  }

  // Obtenir les patients par statut
  getByStatus(status: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/status/${status}`, { headers: this.getHeaders() });
  }

  // Mettre à jour le statut d'un patient
  updateStatus(id: number, status: string): Observable<Patient> {
    return this.http.patch<Patient>(`${this.baseUrl}/${id}/status`, { status }, { headers: this.getHeaders() });
  }

  // Obtenir les patients triés par statut (NOUVEAU)
  getPatientsSortedByStatus(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/sortedByStatus`, { headers: this.getHeaders() });
  }

  // Obtenir le nombre d'interventions du mois
  getInterventionsMois(id: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/${id}/interventions-mois`, { headers: this.getHeaders() });
  }

  assignerSoignant(patientId: number, soignantId: number | null): Observable<Patient> {
    return this.http.patch<Patient>(`${this.baseUrl}/${patientId}/assigner-soignant`,
      { soignantId }, { headers: this.getHeaders() });
  }

  getBySoignant(soignantId: number): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/soignant/${soignantId}`, { headers: this.getHeaders() });
  }

  // Télécharger le PDF des traitements d'un patient
  downloadTreatmentsPdf(id: number): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
    return this.http.get(`${this.baseUrl}/${id}/treatments/pdf`, { headers, responseType: 'blob' });
  }

  // Gestion des erreurs
  private handleError(error: any): Observable<never> {
    console.error('PatientService Error:', error);
    throw error;
  }
}
