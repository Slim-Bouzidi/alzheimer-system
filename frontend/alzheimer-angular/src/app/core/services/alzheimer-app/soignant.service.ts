import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Alerte, StatutAlerte } from '../../models/alzheimer-app/alerte.model';
import { Intervention } from '../../models/alzheimer-app/intervention.model';
import { ReglePatient } from '../../models/alzheimer-app/regle-patient.model';
import { PatientSoignant } from '../../models/alzheimer-app/patient-soignant.model';
import { RapportMedical, Directive, StatutDirective } from '../../models/alzheimer-app/rapport-medical.model';
import { Rappel, RappelMedicament, RappelRepas, RappelRendezVous } from '../../models/alzheimer-app/rappel.model';
import { NotificationTache, StatutNotification } from '../../models/alzheimer-app/notification-tache.model';
import { FormulaireSuiviQuotidien } from '../../models/alzheimer-app/suivi-quotidien.model';
import { RapportHebdomadaire } from '../../models/alzheimer-app/rapport-hebdo.model';
import { EvenementAgenda, StatutAgenda } from '../../models/alzheimer-app/agenda.model';
import { User, UserRole } from '../../models/alzheimer-app/user.model';
import { PatientResumeJour, HistoriqueEntry, PatientTendances, NoteMedicale } from '../../models/alzheimer-app/patient-tracking.model';
import { TranslateService } from '@ngx-translate/core';


@Injectable({ providedIn: 'root' })
export class SoignantService {
  private translate = inject(TranslateService);

  private alertesSubject = new BehaviorSubject<Alerte[]>(this.getMockAlertes());
  private interventionsSubject = new BehaviorSubject<Intervention[]>(this.getMockInterventions());
  private rapportsSubject = new BehaviorSubject<RapportMedical[]>(this.getMockRapports());
  private rappelsSubject = new BehaviorSubject<Rappel[]>(this.getMockRappels());
  private notificationsSubject = new BehaviorSubject<NotificationTache[]>(this.getMockNotifications());
  private formulairesSubject = new BehaviorSubject<FormulaireSuiviQuotidien[]>(this.getMockFormulaires());
  private evenementsAgendaSubject = new BehaviorSubject<EvenementAgenda[]>(this.getMockEvenementsAgenda());

  // Real-time update Subjects for patient tracking panel
  public eventStatusChanged$ = new Subject<{ eventId: string; patientId: string; status: string }>();
  public alerteCreated$ = new Subject<Alerte>();
  public suiviQuotidienUpdated$ = new Subject<{ patientId: string; time: string }>();

  alertes$ = this.alertesSubject.asObservable();
  interventions$ = this.interventionsSubject.asObservable();



  getAlertesActives(): Alerte[] {
    return this.alertesSubject.value;
  }

  getInterventionsDuJour(): Intervention[] {
    return this.interventionsSubject.value;
  }

  getPatientsAssignes(): PatientSoignant[] {
    return this.getMockPatients();
  }

  getReglesPatients(): ReglePatient[] {
    return this.getMockRegles();
  }

  marquerAlerteStatut(alerteId: string, statut: StatutAlerte): Observable<void> {
    const alertes = this.alertesSubject.value.map(a =>
      a.id === alerteId ? { ...a, statut } : a
    );
    this.alertesSubject.next(alertes);
    return of(void 0);
  }

  creerIntervention(intervention: Omit<Intervention, 'id' | 'date' | 'soignantId' | 'soignantNom' | 'peutCompleterRemarques'>): Observable<Intervention> {
    const now = new Date();
    const newOne: Intervention = {
      ...intervention,
      id: 'int-' + Date.now(),
      date: now,
      soignantId: 'soignant-1',
      soignantNom: 'Marie Martin',
      peutCompleterRemarques: true,
    };
    const list = [newOne, ...this.interventionsSubject.value];
    this.interventionsSubject.next(list);
    return of(newOne);
  }

  completerRemarquesIntervention(interventionId: string, remarques: string): Observable<void> {
    const list = this.interventionsSubject.value.map(i =>
      i.id === interventionId ? { ...i, remarques: i.remarques + '\n' + remarques } : i
    );
    this.interventionsSubject.next(list);
    return of(void 0).pipe(delay(300));
  }

  mettreAJourRegle(regleId: string, seuil: number, impactDescription: string): Observable<void> {
    return of(void 0).pipe(delay(400));
  }

  getStatistiquesDuJour(): {
    interventionsTraitees: number;
    alertesTraitees: number;
    tauxReponseMoyen: number;
    patientsPrioritaires: number;
  } {
    const alertes = this.alertesSubject.value;
    const interventions = this.interventionsSubject.value;
    const traitees = alertes.filter(a => a.statut === 'TRAITEE').length;
    const totalAlertes = alertes.length;
    return {
      interventionsTraitees: interventions.length,
      alertesTraitees: traitees,
      tauxReponseMoyen: totalAlertes ? Math.round((traitees / totalAlertes) * 100) : 0,
      patientsPrioritaires: this.getMockPatients().filter(p => p.niveauRisque === 'eleve').length,
    };
  }

  // --- Rapports médicaux reçus ---
  getRapportsMedicauxRecus(): RapportMedical[] {
    return this.rapportsSubject.value;
  }

  marquerRapportLu(rapportId: string): Observable<void> {
    const list = this.rapportsSubject.value.map(r =>
      r.id === rapportId ? { ...r, lu: true } : r
    );
    this.rapportsSubject.next(list);
    return of(void 0).pipe(delay(200));
  }

  marquerDirectiveStatut(directiveId: string, statut: StatutDirective): Observable<void> {
    const list = this.rapportsSubject.value.map(r => ({
      ...r,
      directives: r.directives.map(d => d.id === directiveId ? { ...d, statut } : d),
    }));
    this.rapportsSubject.next(list);
    return of(void 0).pipe(delay(200));
  }

  // --- Rappels ---
  getRappels(): Rappel[] {
    return this.rappelsSubject.value;
  }

  creerRappelMedicament(rappel: Omit<RappelMedicament, 'id' | 'historiqueObservance'>): Observable<RappelMedicament> {
    const newOne: RappelMedicament = {
      ...rappel,
      id: 'rmed-' + Date.now(),
      historiqueObservance: [],
    };
    this.rappelsSubject.next([...this.rappelsSubject.value, newOne]);
    return of(newOne).pipe(delay(300));
  }

  creerRappelRepas(rappel: Omit<RappelRepas, 'id' | 'historiqueObservance'>): Observable<RappelRepas> {
    const newOne: RappelRepas = {
      ...rappel,
      id: 'rrep-' + Date.now(),
      historiqueObservance: [],
    };
    this.rappelsSubject.next([...this.rappelsSubject.value, newOne]);
    return of(newOne).pipe(delay(300));
  }

  creerRappelRendezVous(rappel: Omit<RappelRendezVous, 'id'>): Observable<RappelRendezVous> {
    const newOne: RappelRendezVous = { ...rappel, id: 'rrdv-' + Date.now() };
    this.rappelsSubject.next([...this.rappelsSubject.value, newOne]);
    return of(newOne).pipe(delay(300));
  }

  // --- Notifications tâches (push) ---
  getNotificationsTache(): NotificationTache[] {
    return this.notificationsSubject.value;
  }

  marquerNotificationFait(notificationId: string): Observable<void> {
    const list = this.notificationsSubject.value.map(n =>
      n.id === notificationId ? { ...n, statut: 'fait' as StatutNotification, dateTraite: new Date() } : n
    );
    this.notificationsSubject.next(list);
    return of(void 0).pipe(delay(200));
  }

  marquerNotificationReporter(notificationId: string): Observable<void> {
    const list = this.notificationsSubject.value.map(n =>
      n.id === notificationId ? { ...n, statut: 'reporter' as StatutNotification } : n
    );
    this.notificationsSubject.next(list);
    return of(void 0).pipe(delay(200));
  }

  marquerNotificationProbleme(notificationId: string): Observable<void> {
    const list = this.notificationsSubject.value.map(n =>
      n.id === notificationId ? { ...n, statut: 'probleme_rencontre' as StatutNotification, dateTraite: new Date() } : n
    );
    this.notificationsSubject.next(list);
    return of(void 0).pipe(delay(200));
  }

  // --- Suivi quotidien ---
  getFormulairesSuiviQuotidien(): FormulaireSuiviQuotidien[] {
    return this.formulairesSubject.value;
  }

  getFormulaireSuiviDuJour(patientId: string): FormulaireSuiviQuotidien | undefined {
    const today = new Date().toISOString().slice(0, 10);
    return this.formulairesSubject.value.find(f => f.patientId === patientId && f.date === today);
  }

  sauvegarderSuiviQuotidien(form: Partial<FormulaireSuiviQuotidien> & { patientId: string; patientNom: string }): Observable<FormulaireSuiviQuotidien> {
    const today = new Date().toISOString().slice(0, 10);
    const existing = this.formulairesSubject.value.find(
      f => f.patientId === form.patientId && f.date === today
    );
    const soignantId = 'soignant-1';
    const newOne: FormulaireSuiviQuotidien = {
      id: existing?.id ?? 'f-' + Date.now(),
      patientId: form.patientId,
      patientNom: form.patientNom,
      date: today,
      soignantId,
      activitesRealisees: form.activitesRealisees ?? '',
      medicamentsPris: form.medicamentsPris ?? '',
      medicamentsRefuses: form.medicamentsRefuses ?? '',
      repasConsommes: form.repasConsommes ?? '',
      quantiteRepas: form.quantiteRepas,
      comportementsObserves: form.comportementsObserves ?? '',
      reactionExercicesCognitifs: form.reactionExercicesCognitifs ?? '',
      observanceTraitement: form.observanceTraitement ?? 'oui',
      suiviRecommandations: form.suiviRecommandations ?? 'oui',
      evolution: form.evolution ?? 'stabilite',
      commentaires: form.commentaires ?? '',
      envoye: form.envoye ?? false,
      donepezil: form.donepezil ?? existing?.donepezil,
      rivastigmine: form.rivastigmine ?? existing?.rivastigmine,
      galantamine: form.galantamine ?? existing?.galantamine,
      memantine: form.memantine ?? existing?.memantine,
      effetsMedicamentsObserves: form.effetsMedicamentsObserves ?? existing?.effetsMedicamentsObserves,
      activitesArtistiques: form.activitesArtistiques ?? existing?.activitesArtistiques,
      activitesCorporelles: form.activitesCorporelles ?? existing?.activitesCorporelles,
      activitesCognitives: form.activitesCognitives ?? existing?.activitesCognitives,
      tensionArterielle: form.tensionArterielle ?? existing?.tensionArterielle,
      glycemie: form.glycemie ?? existing?.glycemie,
      cholesterol: form.cholesterol ?? existing?.cholesterol,
      symptomesStade: form.symptomesStade ?? existing?.symptomesStade,
      etatPsychologiqueHumeur: form.etatPsychologiqueHumeur ?? existing?.etatPsychologiqueHumeur,
      vieSociale: form.vieSociale ?? existing?.vieSociale,
      hygieneVie: form.hygieneVie ?? existing?.hygieneVie,
      reponseConseilsMedecin: form.reponseConseilsMedecin ?? existing?.reponseConseilsMedecin,
    };
    const list = existing
      ? this.formulairesSubject.value.map(f => (f.id === existing.id ? newOne : f))
      : [...this.formulairesSubject.value, newOne];
    this.formulairesSubject.next(list);
    return of(newOne).pipe(delay(300));
  }

  envoyerSuiviQuotidien(formulaireId: string): Observable<void> {
    const list = this.formulairesSubject.value.map(f =>
      f.id === formulaireId ? { ...f, envoye: true } : f
    );
    this.formulairesSubject.next(list);
    return of(void 0).pipe(delay(300));
  }

  // --- Rapport hebdomadaire ---
  getRapportHebdomadaireEnCours(patientId: string): RapportHebdomadaire | undefined {
    return this.getMockRapportsHebdo().find(r => r.patientId === patientId && !r.envoyeAuMedecin);
  }

  getRapportsHebdomadaires(): RapportHebdomadaire[] {
    return this.getMockRapportsHebdo();
  }

  envoyerRapportHebdoAuMedecin(rapportId: string): Observable<void> {
    return of(void 0).pipe(delay(400));
  }

  // --- Agenda ---
  getAgendaDuJour(patientId?: string): EvenementAgenda[] {
    const events = this.evenementsAgendaSubject.value;
    const today = new Date().toISOString().slice(0, 10);
    const filtered = events.filter(e => e.date.toISOString().slice(0, 10) === today);
    return patientId ? filtered.filter(e => e.patientId === patientId) : filtered;
  }

  getEvenementsSemaine(): EvenementAgenda[] {
    return this.evenementsAgendaSubject.value;
  }

  marquerEvenementStatut(eventId: string, statut: StatutAgenda): Observable<void> {
    const list = this.evenementsAgendaSubject.value.map(e =>
      e.id === eventId ? { ...e, statut } : e
    );
    this.evenementsAgendaSubject.next(list);
    return of(void 0).pipe(delay(200));
  }



  private getMockAlertes(): Alerte[] {
    const base = new Date();
    return [
      {
        id: 'alt-1',
        patientId: 'p1',
        patientNom: 'Alice Robert',
        type: 'chute',
        gravite: 'URGENCE',
        statut: 'NOUVELLE',
        message: this.translate.instant('MOCK.ALERT_FALL_LIVING_ROOM'),
        date: new Date(base.getTime() - 15 * 60000),
        lieu: this.translate.instant('LOCATION.LIVING_ROOM'),
      },
      {
        id: 'alt-2',
        patientId: 'p2',
        patientNom: 'Jean Dupont',
        type: 'zone_interdite',
        gravite: 'ZONE_INTERDITE',
        statut: 'EN_COURS',
        message: this.translate.instant('MOCK.ALERT_KITCHEN_FORBIDDEN'),
        date: new Date(base.getTime() - 45 * 60000),
        lieu: this.translate.instant('LOCATION.KITCHEN'),
      },
      {
        id: 'alt-3',
        patientId: 'p3',
        patientNom: 'Lucie Bernard',
        type: 'comportement_anormal',
        gravite: 'COMPORTEMENT',
        statut: 'NOUVELLE',
        message: this.translate.instant('MOCK.ALERT_PROLONGED_AGITATION'),
        date: new Date(base.getTime() - 8 * 60000),
      },
      {
        id: 'alt-4',
        patientId: 'p1',
        patientNom: 'Alice Robert',
        type: 'fugue',
        gravite: 'URGENCE',
        statut: 'TRAITEE',
        message: this.translate.instant('MOCK.ALERT_UNAUTHORIZED_EXIT'),
        date: new Date(base.getTime() - 120 * 60000),
        lieu: this.translate.instant('LOCATION.MAIN_DOOR'),
      },
    ];
  }

  private getMockInterventions(): Intervention[] {
    const base = new Date();
    return [
      {
        id: 'int-1',
        patientId: 'p1',
        patientNom: 'Alice Robert',
        type: 'visite',
        dureeMinutes: 25,
        description: this.translate.instant('MOCK.INTERVENTION_POST_FALL_CHECK'),
        remarques: this.translate.instant('MOCK.INTERVENTION_PATIENT_STABLE'),
        date: new Date(base.getTime() - 60 * 60000),
        soignantId: 's1',
        soignantNom: 'Marie Martin',
        alerteId: 'alt-1',
        peutCompleterRemarques: true,
      },
      {
        id: 'int-2',
        patientId: 'p2',
        patientNom: 'Jean Dupont',
        type: 'appel',
        dureeMinutes: 10,
        description: this.translate.instant('MOCK.INTERVENTION_FORBIDDEN_ZONE'),
        remarques: this.translate.instant('MOCK.INTERVENTION_FAMILY_NOTIFIED'),
        date: new Date(base.getTime() - 30 * 60000),
        soignantId: 's1',
        soignantNom: 'Marie Martin',
        alerteId: 'alt-2',
        peutCompleterRemarques: true,
      },
    ];
  }

  private getMockPatients(): PatientSoignant[] {
    return [
      {
        id: 'p1',
        nom: 'Robert',
        prenom: 'Alice',
        niveauRisque: 'eleve',
        nbAlertesAujourdhui: 2,
        derniereIntervention: new Date(Date.now() - 60 * 60000),
        derniereInterventionLibelle: this.translate.instant('MOCK.INTERVENTION_POST_FALL_CHECK'),
        medecinReferent: 'Dr. Martin',
        age: 82,
        sexe: 'F',
      },
      {
        id: 'p2',
        nom: 'Dupont',
        prenom: 'Jean',
        niveauRisque: 'moyen',
        nbAlertesAujourdhui: 1,
        derniereIntervention: new Date(Date.now() - 30 * 60000),
        derniereInterventionLibelle: this.translate.instant('MOCK.INTERVENTION_FORBIDDEN_ZONE'),
        medecinReferent: 'Dr. Lefebvre',
        age: 75,
        sexe: 'M',
      },
      {
        id: 'p3',
        nom: 'Bernard',
        prenom: 'Lucie',
        niveauRisque: 'eleve',
        nbAlertesAujourdhui: 1,
        medecinReferent: 'Dr. Martin',
        age: 88,
        sexe: 'F',
      },
      {
        id: 'p4',
        nom: 'Petit',
        prenom: 'André',
        niveauRisque: 'faible',
        nbAlertesAujourdhui: 0,
        derniereIntervention: new Date(Date.now() - 24 * 3600 * 1000),
        derniereInterventionLibelle: this.translate.instant('MOCK.INTERVENTION_DAILY_VISIT'),
        medecinReferent: 'Dr. Lefebvre',
        age: 80,
        sexe: 'M',
      },
    ];
  }

  private getMockRegles(): ReglePatient[] {
    return [
      {
        id: 'r1',
        patientId: 'p1',
        patientNom: 'Alice Robert',
        typeRegle: 'detection_chute',
        libelle: this.translate.instant('MOCK.RULE_FALL_DETECTION_DELAY'),
        seuilValeur: 15,
        unite: 'min',
        ancienSeuil: 30,
        impactDescription: this.translate.instant('MOCK.RULE_FASTER_FALL_ALERTS'),
        actif: true,
        dateModif: new Date(),
      },
      {
        id: 'r2',
        patientId: 'p2',
        patientNom: 'Jean Dupont',
        typeRegle: 'zone_interdite',
        libelle: this.translate.instant('MOCK.RULE_KITCHEN_SENSITIVITY'),
        seuilValeur: 1,
        unite: this.translate.instant('UNIT.ENTRY'),
        impactDescription: this.translate.instant('MOCK.RULE_ALERT_EACH_KITCHEN_ENTRY'),
        actif: true,
        dateModif: new Date(),
      },
    ];
  }

  private getMockRapports(): RapportMedical[] {
    const d = new Date();
    return [
      {
        id: 'rapp-1',
        patientId: 'p1',
        patientNom: 'Alice Robert',
        medecinNom: 'Dr. Martin',
        dateConsultation: new Date(d.getTime() - 3 * 24 * 3600 * 1000),
        dateReception: new Date(d.getTime() - 2 * 24 * 3600 * 1000),
        resume: this.translate.instant('MOCK.REPORT_FOLLOW_UP_SUMMARY'),
        lu: true,
        directives: [
          { id: 'dir-1', rapportId: 'rapp-1', type: 'rappel_medicament', libelle: this.translate.instant('MOCK.DIRECTIVE_CONFIGURE_DONEPEZIL'), detail: this.translate.instant('MOCK.DIRECTIVE_MORNING_EVENING'), statut: 'execute', patientId: 'p1', patientNom: 'Alice Robert', rappelId: 'rmed-1' },
          { id: 'dir-2', rapportId: 'rapp-1', type: 'rappel_repas', libelle: this.translate.instant('MOCK.DIRECTIVE_MEAL_REMINDER_1230'), detail: this.translate.instant('MOCK.DIRECTIVE_NO_SALT_DIET'), statut: 'execute', patientId: 'p1', patientNom: 'Alice Robert', rappelId: 'rrep-1' },
          { id: 'dir-3', rapportId: 'rapp-1', type: 'rappel_rendez_vous', libelle: this.translate.instant('MOCK.DIRECTIVE_PHYSIO_APPOINTMENT'), detail: this.translate.instant('MOCK.DIRECTIVE_THURSDAY_PHYSIO'), statut: 'en_cours', patientId: 'p1', patientNom: 'Alice Robert' },
        ],
      },
      {
        id: 'rapp-2',
        patientId: 'p2',
        patientNom: 'Jean Dupont',
        medecinNom: 'Dr. Lefebvre',
        dateConsultation: new Date(d.getTime() - 1 * 24 * 3600 * 1000),
        dateReception: new Date(d.getTime() - 1 * 24 * 3600 * 1000),
        resume: this.translate.instant('MOCK.REPORT_CHECKUP_SUMMARY'),
        lu: false,
        directives: [
          { id: 'dir-4', rapportId: 'rapp-2', type: 'rappel_repas', libelle: this.translate.instant('MOCK.DIRECTIVE_MEAL_REMINDERS'), detail: this.translate.instant('MOCK.DIRECTIVE_BALANCED_MEAL'), statut: 'non_lu', patientId: 'p2', patientNom: 'Jean Dupont' },
        ],
      },
    ];
  }

  private getMockRappels(): Rappel[] {
    const today = new Date().toISOString().slice(0, 10);
    return [
      {
        id: 'rmed-1',
        type: 'medicament',
        patientId: 'p1',
        patientNom: 'Alice Robert',
        nom: 'Donépézil',
        dosage: '10mg',
        horaires: ['09:00', '20:00'],
        frequence: this.translate.instant('MOCK.FREQUENCY_TWICE_DAILY'),
        directiveId: 'dir-1',
        actif: true,
        historiqueObservance: [{ date: today, pris: true }, { date: new Date(Date.now() - 864e5).toISOString().slice(0, 10), pris: true }],
      },
      {
        id: 'rrep-1',
        type: 'repas',
        patientId: 'p1',
        patientNom: 'Alice Robert',
        heure: '12:30',
        regimeAlimentaire: this.translate.instant('MOCK.DIET_NO_SALT'),
        directiveId: 'dir-2',
        actif: true,
        historiqueObservance: [{ date: today, consomme: true, quantite: this.translate.instant('MOCK.QUANTITY_NORMAL') }],
      },
      {
        id: 'rrdv-1',
        type: 'rendez_vous',
        patientId: 'p1',
        patientNom: 'Alice Robert',
        date: '2025-02-15',
        heure: '14:00',
        typeConsultation: this.translate.instant('MOCK.CONSULTATION_PHYSIOTHERAPY'),
        lieu: this.translate.instant('MOCK.LOCATION_PHYSIO_OFFICE'),
        actif: true,

      },
    ];
  }

  private getMockNotifications(): NotificationTache[] {
    const base = new Date();
    return [
      { id: 'notif-1', rappelId: 'rmed-1', type: 'medicament', titre: this.translate.instant('NOTIFICATION.ADMINISTER_MEDICATION'), message: this.translate.instant('MOCK.NOTIF_ADMINISTER_DONEPEZIL'), heure: '09:00', date: base, patientId: 'p1', patientNom: 'Alice Robert', statut: 'fait', dateTraite: base },
      { id: 'notif-2', rappelId: 'rrep-1', type: 'repas', titre: this.translate.instant('NOTIFICATION.MEAL_REMINDER'), message: this.translate.instant('MOCK.NOTIF_MEAL_ROBERT'), heure: '12:30', date: base, patientId: 'p1', patientNom: 'Alice Robert', statut: 'a_faire' },
      { id: 'notif-3', rappelId: 'rrdv-1', type: 'rendez_vous', titre: this.translate.instant('NOTIFICATION.ACCOMPANY_APPOINTMENT'), message: this.translate.instant('MOCK.NOTIF_ACCOMPANY_PHYSIO'), heure: '14:00', date: base, patientId: 'p1', patientNom: 'Alice Robert', statut: 'a_faire' },
    ];
  }

  private getMockFormulaires(): FormulaireSuiviQuotidien[] {
    const today = new Date().toISOString().slice(0, 10);
    return [
      {
        id: 'f-1',
        patientId: 'p1',
        patientNom: 'Alice Robert',
        date: today,
        soignantId: 'soignant-1',
        activitesRealisees: this.translate.instant('MOCK.FORM_ACTIVITIES'),
        medicamentsPris: this.translate.instant('MOCK.FORM_MEDS_TAKEN'),
        medicamentsRefuses: '',
        repasConsommes: this.translate.instant('MOCK.FORM_MEALS_CONSUMED'),
        quantiteRepas: this.translate.instant('MOCK.QUANTITY_NORMAL'),
        comportementsObserves: this.translate.instant('MOCK.FORM_BEHAVIORS'),
        reactionExercicesCognitifs: this.translate.instant('MOCK.FORM_COGNITIVE_REACTION'),
        observanceTraitement: 'oui',
        suiviRecommandations: 'oui',
        evolution: 'stabilite',
        commentaires: this.translate.instant('MOCK.FORM_NO_INCIDENT'),
        envoye: false,
      },
    ];
  }

  private getMockEvenementsAgenda(): EvenementAgenda[] {
    const d = new Date();
    return [
      { id: 'ev-1', type: 'medicament', heure: '09:00', titre: 'Donépézil 10mg', detail: 'Alice Robert', patientId: 'p1', patientNom: 'Alice Robert', statut: 'fait', rappelId: 'rmed-1', date: d },
      { id: 'ev-2', type: 'repas', heure: '12:30', titre: this.translate.instant('AGENDA.MEAL'), detail: 'Alice Robert - ' + this.translate.instant('MOCK.DIET_NO_SALT'), patientId: 'p1', patientNom: 'Alice Robert', statut: 'en_attente', rappelId: 'rrep-1', date: d },
      { id: 'ev-3', type: 'rendez_vous', heure: '14:00', titre: this.translate.instant('MOCK.CONSULTATION_PHYSIOTHERAPY'), detail: this.translate.instant('MOCK.LOCATION_PHYSIO_OFFICE_SHORT'), patientId: 'p1', patientNom: 'Alice Robert', statut: 'en_attente', date: d },
      { id: 'ev-5', type: 'medicament', heure: '10:00', titre: 'Aricept 5mg', detail: 'Jean Dupont', patientId: 'p2', patientNom: 'Jean Dupont', statut: 'en_attente', date: d },
      { id: 'ev-6', type: 'repas', heure: '12:00', titre: this.translate.instant('AGENDA.LUNCH'), detail: 'Jean Dupont', patientId: 'p2', patientNom: 'Jean Dupont', statut: 'en_attente', date: d },
      { id: 'ev-7', type: 'medicament', heure: '08:30', titre: 'Ebixa 10mg', detail: 'Lucie Bernard', patientId: 'p3', patientNom: 'Lucie Bernard', statut: 'fait', date: d },
      { id: 'ev-8', type: 'repas', heure: '12:00', titre: this.translate.instant('AGENDA.LUNCH'), detail: 'Lucie Bernard', patientId: 'p3', patientNom: 'Lucie Bernard', statut: 'en_attente', date: d },
    ];
  }

  private getMockRapportsHebdo(): RapportHebdomadaire[] {
    const d = new Date();
    const debut = new Date(d);
    debut.setDate(debut.getDate() - 7);
    const fin = new Date(d);
    return [
      {
        id: 'rh-1',
        patientId: 'p1',
        patientNom: 'Alice Robert',
        soignantId: 'soignant-1',
        dateDebut: debut.toISOString().slice(0, 10),
        dateFin: fin.toISOString().slice(0, 10),
        formulaireIds: ['f-1', 'f-2', 'f-3', 'f-4', 'f-5'],
        tauxObservanceMedicaments: 92,
        tauxObservanceRepas: 88,
        tauxObservanceRendezVous: 100,
        incidentsNotables: this.translate.instant('MOCK.NO_NOTABLE_INCIDENTS'),
        observationsGenerales: this.translate.instant('MOCK.PATIENT_STABLE_GOOD_COMPLIANCE'),
        envoyeAuMedecin: false,
      },
    ];
  }

  // ============================================
  // PATIENT TRACKING PANEL METHODS
  // ============================================

  /**
   * Get patient by ID
   */
  getPatient(patientId: string): Observable<any> {
    const patients = this.getMockPatients();
    const patient = patients.find(p => p.id === patientId);
    return of(patient); // Instant mock response
  }

  /**
   * Get patient daily resume (meds, meals, activities progress)
   */
  getPatientResumeJour(patientId: string, date: string): Observable<PatientResumeJour> {
    return combineLatest([
      this.evenementsAgendaSubject.asObservable(),
      this.alertesSubject.asObservable()
    ]).pipe(
      map(([events, alertes]: [EvenementAgenda[], Alerte[]]) => {
        const patientEvents = events.filter(e => e.patientId === patientId && e.date.toISOString().slice(0, 10) === date);
        const medications = patientEvents.filter(e => e.type === 'medicament');
        const meals = patientEvents.filter(e => e.type === 'repas');
        const activities = patientEvents.filter(e => e.type === 'activite');

        const resume: PatientResumeJour = {
          patientId,
          date,
          medications: {
            total: medications.length,
            pris: medications.filter(m => m.statut === 'fait').length,
            percentage: medications.length > 0
              ? Math.round((medications.filter(m => m.statut === 'fait').length / medications.length) * 100)
              : 0,
            details: medications.map(m => ({
              nom: m.titre,
              statut: m.statut === 'fait' ? 'pris' : (this.isEventLate(m) ? 'en_retard' : 'a_venir')
            }))
          },
          meals: {
            total: meals.length,
            pris: meals.filter(m => m.statut === 'fait').length,
            percentage: meals.length > 0
              ? Math.round((meals.filter(m => m.statut === 'fait').length / meals.length) * 100)
              : 0,
            details: meals.map(m => ({
              type: m.titre,
              statut: m.statut === 'fait' ? 'pris' : (this.isEventLate(m) ? 'en_retard' : 'a_venir')
            }))
          },
          activities: {
            total: activities.length,
            realisees: activities.filter(a => a.statut === 'fait').length,
            percentage: activities.length > 0
              ? Math.round((activities.filter(a => a.statut === 'fait').length / activities.length) * 100)
              : 0,
            details: activities.map(a => ({
              nom: a.titre,
              statut: a.statut === 'fait' ? 'fait' : (this.isEventLate(a) ? 'en_retard' : 'a_faire')
            }))
          },
          alertesCount: alertes.filter(
            a => a.patientId === patientId && a.statut !== 'TRAITEE'
          ).length
        };
        return resume;
      }),
    );
  }

  /**
   * Get active alerts for a patient
   */
  getPatientAlertesActives(patientId: string): Observable<Alerte[]> {
    return this.alertesSubject.asObservable().pipe(
      map((allAlertes: Alerte[]) => {
        const alertes = allAlertes.filter(
          (a: Alerte) => a.patientId === patientId && a.statut !== 'TRAITEE'
        );
        // Sort by gravity: URGENCE > COMPORTEMENT > ZONE_INTERDITE
        const gravityOrder: { [key: string]: number } = { 'URGENCE': 0, 'COMPORTEMENT': 1, 'ZONE_INTERDITE': 2 };
        alertes.sort((a: Alerte, b: Alerte) => (gravityOrder[a.gravite] ?? 99) - (gravityOrder[b.gravite] ?? 99));
        return alertes;
      }),
    );
  }

  /**
   * Get patient history for a day
   */
  getPatientHistoriqueJour(patientId: string, date: string): Observable<any[]> {
    return this.evenementsAgendaSubject.asObservable().pipe(
      map((events: EvenementAgenda[]) => {
        const patientEvents = events.filter(
          (e: EvenementAgenda) => e.patientId === patientId && e.date.toISOString().slice(0, 10) === date && e.statut === 'fait'
        );

        const historique = patientEvents.map((e: EvenementAgenda) => ({
          id: e.id,
          time: e.heure,
          type: e.type,
          description: `${e.titre}`,
          soignantNom: this.translate.instant('SOIGNANT.MAIN_CAREGIVER'), // Mock
          statut: e.statut,
          icon: this.getEventIcon(e.type)
        }));

        // Sort by time descending
        historique.sort((a: any, b: any) => b.time.localeCompare(a.time));
        return historique;
      }),
    );
  }

  /**
   * Check if daily tracking is filled
   */
  isDailyTrackingFilled(patientId: string, date: string): Observable<{ filled: boolean; time?: string }> {
    return this.formulairesSubject.asObservable().pipe(
      map((all: FormulaireSuiviQuotidien[]) => {
        const formulaires = all.filter(
          (f: FormulaireSuiviQuotidien) => f.patientId === patientId && f.date === date
        );

        if (formulaires.length > 0) {
          return {
            filled: true,
            time: '08:00' // Mock time
          };
        }
        return { filled: false };
      }),
    );
  }

  /**
   * Mark alert as treated
   */
  traiterAlerte(alerteId: string, patientId: string): Observable<void> {
    return this.marquerAlerteStatut(alerteId, 'TRAITEE');
  }

  /**
   * Get all caregivers (staff)
   */
  getSoignantsDisponibles(): Observable<User[]> {
    const caregivers = [
      { id: 2, firstName: 'Marie', lastName: 'Martin', role: UserRole.SOIGNANT, email: 'soignant@alzheimer.fr', createdAt: new Date(), lastLogin: new Date() },
      { id: 10, firstName: 'Claire', lastName: 'Petit', role: UserRole.SOIGNANT, email: 'claire@alzheimer.fr', createdAt: new Date(), lastLogin: new Date() }
    ];
    return of(caregivers as User[]);
  }

  /**
   * Assign a patient to a caregiver
   */
  assignerPatient(patientId: string, soignantId: string): Observable<void> {
    console.log(`Assigning patient ${patientId} to caregiver ${soignantId}`);
    // In real app, update DB. Here we just mock success.
    return of(void 0).pipe(delay(500));
  }

  /**
   * Doctor sends instruction/report to caregiver
   */
  envoyerInstructionMedicale(patientId: string, instruction: string): Observable<void> {
    const patient = this.getMockPatients().find(p => p.id === patientId);
    const now = new Date();
    const newRapport: RapportMedical = {
      id: 'doc-note-' + Date.now(),
      patientId,
      patientNom: patient ? `${patient.prenom} ${patient.nom}` : this.translate.instant('PATIENT.UNKNOWN'),
      medecinNom: 'Dr. Marc Lefebvre',
      dateConsultation: now,
      dateReception: now,
      resume: instruction,
      directives: [
        {
          id: 'dir-' + Date.now(),
          rapportId: 'doc-note-' + Date.now(),
          type: 'rappel_medicament', // Default mock type
          libelle: this.translate.instant('MEDICAL.INSTRUCTION'),
          detail: instruction,
          statut: 'non_lu',
          patientId,
          patientNom: patient ? `${patient.prenom} ${patient.nom}` : this.translate.instant('PATIENT.UNKNOWN')
        }
      ],
      lu: false
    };

    this.rapportsSubject.next([newRapport, ...this.rapportsSubject.value]);
    return of(void 0).pipe(delay(500));
  }

  /**
   * Helper to check if event is late
   */
  private isEventLate(event: EvenementAgenda): boolean {
    if (event.statut === 'fait') return false;
    const now = new Date();
    const eventDate = new Date(event.date);
    const [hours, minutes] = event.heure.split(':').map(Number);
    eventDate.setHours(hours, minutes, 0, 0);
    return now > eventDate;
  }

  /**
   * Helper to get event icon
   */
  private getEventIcon(type: string): string {
    switch (type) {
      case 'medicament': return '💊';
      case 'repas': return '🍽️';
      case 'activite': return '🏃';
      case 'rendez_vous': return '👨‍⚕️';
      default: return '📋';
    }
  }

  /**
   * Get patient trends for the last 7 days
   */
  getPatientTendances(patientId: string): Observable<PatientTendances> {
    // Mock data for trends
    const tendances: PatientTendances = {
      observanceMedicaments: { value: 92, evolution: +5 },
      qualiteSommeil: { value: 7.5, evolution: -0.5 },
      participationActivites: { value: 85, evolution: +12 },
      nombreAlertes: { value: 3, evolution: -2 }
    };
    return of(tendances);
  }

  /**
   * Get the latest medical note for a patient
   */
  getLatestNoteMedicale(patientId: string): Observable<NoteMedicale> {
    const note: NoteMedicale = {
      id: 'note-123',
      medecinNom: 'Dr. Martin',
      date: new Date(Date.now() - 2 * 24 * 3600000), // 2 days ago
      contenu: this.translate.instant('MOCK.MEDICAL_NOTE_CONTENT'),
      directives: [
        { id: 'dir-1', libelle: this.translate.instant('MOCK.DIRECTIVE_COGNITIVE_EXERCISES'), statut: 'applique' },
        { id: 'dir-2', libelle: this.translate.instant('MOCK.DIRECTIVE_ASSISTED_WALK'), statut: 'en_cours' },
        { id: 'dir-3', libelle: this.translate.instant('MOCK.DIRECTIVE_BLOOD_PRESSURE_CHECK'), statut: 'applique' }
      ]
    };
    return of(note);
  }
}
