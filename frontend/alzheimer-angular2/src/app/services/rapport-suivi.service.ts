import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  RapportSuiviStructure,
  ReponseDirectiveSoignant,
  StatutDirectiveSuivi,
  dateDansPeriodeRapport
} from '../models/rapport-suivi-structure.model';

@Injectable({ providedIn: 'root' })
export class RapportSuiviService {
  private rapportsSubject = new BehaviorSubject<RapportSuiviStructure[]>(this.getMockRapports());

  getRapportsSuiviStructure(): RapportSuiviStructure[] {
    return this.rapportsSubject.value;
  }

  getRapportsSuiviStructure$(): Observable<RapportSuiviStructure[]> {
    return this.rapportsSubject.asObservable();
  }

  getRapportById(id: string): RapportSuiviStructure | undefined {
    return this.rapportsSubject.value.find(r => r.id === id);
  }

  getRapportsByPatient(patientId: string): RapportSuiviStructure[] {
    return this.rapportsSubject.value.filter(r => r.patientId === patientId);
  }

  /** Médecin : créer et envoyer un rapport de suivi (intégré au suivi soignant) */
  creerRapportSuivi(rapport: Omit<RapportSuiviStructure, 'id' | 'reponsesSoignant' | 'luParSoignant'>): Observable<RapportSuiviStructure> {
    const directiveIds: string[] = [
      ...rapport.observanceMedicamenteuse.traitements.map(t => t.id),
      ...rapport.alimentationHydratation.directives.map(d => d.id),
      ...rapport.vieSocialeHygiene.directives.map(d => d.id)
    ];
    const reponsesSoignant: ReponseDirectiveSoignant[] = directiveIds.map(directiveId => ({
      directiveId,
      statut: 'en_cours' as StatutDirectiveSuivi,
      commentaireSoignant: ''
    }));
    const newRapport: RapportSuiviStructure = {
      ...rapport,
      id: 'rs-' + Date.now(),
      reponsesSoignant,
      luParSoignant: false
    };
    this.rapportsSubject.next([newRapport, ...this.rapportsSubject.value]);
    return of(newRapport).pipe(delay(300));
  }

  /** Soignant : marquer le rapport comme lu */
  marquerLu(rapportId: string): Observable<void> {
    const list = this.rapportsSubject.value.map(r =>
      r.id === rapportId ? { ...r, luParSoignant: true, dateLectureSoignant: new Date() } : r
    );
    this.rapportsSubject.next(list);
    return of(void 0).pipe(delay(200));
  }

  /** Soignant : mettre à jour le statut et le commentaire d'une directive (commentaire obligatoire si non_fait) */
  mettreAJourReponseDirective(
    rapportId: string,
    directiveId: string,
    statut: StatutDirectiveSuivi,
    commentaireSoignant: string
  ): Observable<void> {
    const list = this.rapportsSubject.value.map(r => {
      if (r.id !== rapportId) return r;
      const reponses = r.reponsesSoignant.map(rep =>
        rep.directiveId === directiveId
          ? { ...rep, statut, commentaireSoignant, dateMaj: new Date() }
          : rep
      );
      return { ...r, reponsesSoignant: reponses };
    });
    this.rapportsSubject.next(list);
    return of(void 0).pipe(delay(200));
  }

  /** Pour la fiche de transmission : rapport dont la période couvre la date du jour (ou la date fournie) */
  getRapportPourPatientEtDate(patientId: string, dateStr: string): RapportSuiviStructure | undefined {
    const rapports = this.rapportsSubject.value.filter(r => r.patientId === patientId && r.dateDebut && r.dateFin);
    return rapports.find(r => dateDansPeriodeRapport(dateStr, r));
  }

  /** Dernier rapport de suivi pour un patient (pour affichage liste). Si dateStr fourni, préfère le rapport couvrant cette date. */
  getDernierRapportPourPatient(patientId: string, dateStr?: string): RapportSuiviStructure | undefined {
    const list = this.rapportsSubject.value.filter(r => r.patientId === patientId);
    if (dateStr) {
      const couvrant = list.find(r => r.dateDebut && r.dateFin && dateDansPeriodeRapport(dateStr, r));
      if (couvrant) return couvrant;
    }
    return list.length > 0 ? list[0] : undefined;
  }

  private getMockRapports(): RapportSuiviStructure[] {
    const now = new Date();
    const dateDebut = new Date(now);
    dateDebut.setDate(dateDebut.getDate() - 2);
    const dateFin = new Date(dateDebut);
    dateFin.setDate(dateFin.getDate() + 6);
    const rapport: RapportSuiviStructure = {
      id: 'rs-1',
      patientId: 'p1',
      patientNom: 'Robert',
      patientPrenom: 'Alice',
      patientAge: 82,
      dateCreation: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
      medecinNom: 'Dr. Marc Lefebvre',
      medecinId: 'med-1',
      dateDebut,
      dateFin,
      observanceMedicamenteuse: {
        traitements: [
          { id: 't1', nom: 'Donépézil', dosage: '10 mg', momentPrise: 'matin', attentesSuivi: 'Vérifier prise au petit-déjeuner, noter tout refus' },
          { id: 't2', nom: 'Donépézil', dosage: '10 mg', momentPrise: 'soir', detail: 'au coucher', attentesSuivi: 'Idem' },
          { id: 't3', nom: 'Kardégic', dosage: '75 mg', momentPrise: 'matin', attentesSuivi: 'À jeun' }
        ],
        attentesGenerales: 'Signaler tout oubli ou refus dans la fiche de transmission.'
      },
      alimentationHydratation: {
        directives: [
          { id: 'd1', libelle: 'Hydratation minimale 1,5 L/j', detail: 'Eau, tisanes. Éviter déshydratation.', type: 'alimentation_hydratation' },
          { id: 'd2', libelle: 'Repas à heures fixes (12h30, 19h)', type: 'alimentation_hydratation' }
        ]
      },
      vieSocialeHygiene: {
        directives: [
          { id: 'd3', libelle: 'Activités sociales et de loisirs', type: 'vie_sociale_hygiene' },
          { id: 'd4', libelle: 'Soins d\'hygiène personnelle', type: 'vie_sociale_hygiene' }
        ]
      },
      reponsesSoignant: [
        { directiveId: 't1', statut: 'fait', commentaireSoignant: '' },
        { directiveId: 't2', statut: 'en_cours', commentaireSoignant: '' },
        { directiveId: 't3', statut: 'fait', commentaireSoignant: '' },
        { directiveId: 'd1', statut: 'non_fait', commentaireSoignant: 'Hydratation insuffisante aujourd\'hui' },
        { directiveId: 'd2', statut: 'fait', commentaireSoignant: '' },
        { directiveId: 'd3', statut: 'en_cours', commentaireSoignant: '' },
        { directiveId: 'd4', statut: 'fait', commentaireSoignant: '' }
      ],
      signatureValidation: {
        medecinNom: 'Dr. Marc Lefebvre',
        medecinId: 'med-1',
        dateValidation: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
        valide: true
      },
      luParSoignant: true,
      dateLectureSoignant: new Date(now.getTime() - 1 * 24 * 3600 * 1000)
    };
    return [rapport];
  }
}
