import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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
  private readonly storageKey = 'doctor.rendezvous.local-store';

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
    return of(this.readStore());
  }

  // Lire un rendez-vous par ID
  getById(id: number): Observable<RendezVous> {
    return of(this.readStore().find((item) => item.id === id) ?? {});
  }

  // Créer un nouveau rendez-vous
  create(rendezVous: RendezVous): Observable<RendezVous> {
    const collection = this.readStore();
    const nextId = collection.reduce((max, item) => Math.max(max, Number(item.id ?? 0)), 0) + 1;
    const created = { ...rendezVous, id: nextId };
    collection.push(created);
    this.writeStore(collection);
    return of(created);
  }

  // Mettre à jour un rendez-vous
  update(id: number, rendezVous: RendezVous): Observable<RendezVous> {
    const collection = this.readStore();
    const index = collection.findIndex((item) => item.id === id);
    const updated = { ...collection[index], ...rendezVous, id };

    if (index >= 0) {
      collection[index] = updated;
    } else {
      collection.push(updated);
    }

    this.writeStore(collection);
    return of(updated);
  }

  // Supprimer un rendez-vous
  delete(id: number): Observable<void> {
    this.writeStore(this.readStore().filter((item) => item.id !== id));
    return of(void 0);
  }

  // Méthodes supplémentaires utiles

  // Obtenir les rendez-vous d'un patient
  getByPatient(patientId: number): Observable<RendezVous[]> {
    return of(this.readStore().filter((item) => Number(item.patient?.id ?? item.patient?.idPatient) === patientId));
  }

  // Obtenir les rendez-vous par date
  getByDate(date: string): Observable<RendezVous[]> {
    return of(this.readStore().filter((item) => (item.dateHeure ?? '').startsWith(date)));
  }

  // Obtenir les rendez-vous entre deux dates
  getByDateRange(dateDebut: string, dateFin: string): Observable<RendezVous[]> {
    const start = new Date(dateDebut).getTime();
    const end = new Date(dateFin).getTime();
    return of(
      this.readStore().filter((item) => {
        const timestamp = new Date(item.dateHeure ?? '').getTime();
        return Number.isFinite(timestamp) && timestamp >= start && timestamp <= end;
      })
    );
  }

  // Confirmer un rendez-vous
  confirmer(id: number): Observable<RendezVous> {
    return this.update(id, { statut: 'CONFIRME' });
  }

  // Annuler un rendez-vous
  annuler(id: number): Observable<RendezVous> {
    return this.update(id, { statut: 'ANNULE' });
  }

  // Obtenir les patients disponibles
  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${environment.apiUrl}/patient/allPatient`, { headers: this.getHeaders() });
  }

  private readStore(): RendezVous[] {
    if (typeof window === 'undefined') {
      return this.seedRendezVous();
    }

    const raw = window.localStorage.getItem(this.storageKey);
    if (!raw) {
      const seed = this.seedRendezVous();
      this.writeStore(seed);
      return seed;
    }

    try {
      const parsed = JSON.parse(raw) as RendezVous[];
      return Array.isArray(parsed) ? parsed : this.seedRendezVous();
    } catch {
      const seed = this.seedRendezVous();
      this.writeStore(seed);
      return seed;
    }
  }

  private writeStore(collection: RendezVous[]): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.storageKey, JSON.stringify(collection));
  }

  private seedRendezVous(): RendezVous[] {
    return [
      {
        id: 1,
        patient: { id: 1, nomComplet: 'Marie Dupont' },
        titre: 'Suivi memoire',
        type: 'Consultation',
        statut: 'CONFIRME',
        lieu: 'Cabinet principal',
        motif: 'Evaluation cognitive trimestrielle',
        notes: 'Apporter le carnet de suivi et les derniers bilans.',
        duree: 45,
        envoyerRappel: true,
        dateHeure: '2025-04-22T09:30:00',
        telephone: '06 12 34 56 78'
      },
      {
        id: 2,
        patient: { id: 2, nomComplet: 'Jean Martin' },
        titre: 'Ajustement traitement',
        type: 'Controle',
        statut: 'PLANIFIE',
        lieu: 'Teleconsultation',
        motif: 'Point sur adherence et fatigue',
        notes: 'Verifier les effets secondaires signales par l aidant.',
        duree: 30,
        envoyerRappel: true,
        dateHeure: '2025-04-23T14:00:00',
        telephone: '06 23 45 67 89'
      },
      {
        id: 3,
        patient: { id: 3, nomComplet: 'Alice Bernard' },
        titre: 'Visite de routine',
        type: 'Suivi',
        statut: 'PLANIFIE',
        lieu: 'Cabinet secondaire',
        motif: 'Suivi neurologique mensuel',
        notes: 'Prevoir un point avec le soignant apres la consultation.',
        duree: 30,
        envoyerRappel: true,
        dateHeure: '2025-04-25T11:15:00',
        telephone: '06 34 56 78 90'
      }
    ];
  }
}
