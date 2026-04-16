import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SoignantService } from './soignant.service';
import { Alerte, GraviteAlerte, StatutAlerte } from '../models/alerte.model';
import { PatientSoignant } from '../models/patient-soignant.model';
import { RapportMedical, Directive, StatutDirective } from '../models/rapport-medical.model';
import { Rappel } from '../models/rappel.model';
import { isRappelMedicament, isRappelRepas, isRappelRendezVous } from '../models/rappel.model';
import { NotificationTache } from '../models/notification-tache.model';
import { FormulaireSuiviQuotidien } from '../models/suivi-quotidien.model';
import { RapportHebdomadaire } from '../models/rapport-hebdo.model';
import { EvenementAgenda, StatutAgenda } from '../models/agenda.model';

@Component({
  selector: 'app-soignant-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './soignant-dashboard.component.html',
  styleUrls: ['./soignant-dashboard.component.css'],
})
export class SoignantDashboardComponent implements OnInit, OnDestroy {
  soignantName = 'Marie Martin';
  alertes: Alerte[] = [];
  patients: PatientSoignant[] = [];
  stats: {
    alertesTraitees: number;
    tauxReponseMoyen: number;
    patientsPrioritaires: number;
  } = {
      alertesTraitees: 0,
      tauxReponseMoyen: 0,
      patientsPrioritaires: 0,
    };





  rapports: RapportMedical[] = [];
  rappels: Rappel[] = [];
  notifications: NotificationTache[] = [];
  formulaireSuivi: FormulaireSuiviQuotidien | null = null;
  rapportsHebdo: RapportHebdomadaire[] = [];
  agendaDuJour: EvenementAgenda[] = [];
  currentDate = new Date();
  currentTime = '';

  /** Pour la sidebar (badges) */
  alertesNonTraiteesCount = 0;
  rapportsNonLusCount = 0;
  rapportHebdoNonEnvoye = false;
  notificationsCount = 0;
  suiviRempliAujourdhui = false;

  showSuiviModal = false;
  showRappelModal = false;
  suiviFormPatientId = '';
  suiviForm: Partial<FormulaireSuiviQuotidien> & { patientNom: string } = {
    patientId: '',
    patientNom: '',
    medicamentsPris: '',
    medicamentsRefuses: '',
    repasConsommes: '',
    quantiteRepas: '',
    comportementsObserves: '',
    reactionExercicesCognitifs: '',
    observanceTraitement: 'oui',
    suiviRecommandations: 'oui',
    evolution: 'stabilite',
    commentaires: '',
  };



  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    private soignantService: SoignantService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.refresh();
    this.intervalId = setInterval(() => {
      this.currentDate = new Date();
      this.currentTime = this.currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  refresh(): void {
    this.currentDate = new Date();
    this.currentTime = this.currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.alertes = this.soignantService.getAlertesActives();
    this.patients = this.soignantService.getPatientsAssignes();

    this.stats = this.soignantService.getStatistiquesDuJour();
    this.rapports = this.soignantService.getRapportsMedicauxRecus();
    this.rappels = this.soignantService.getRappels();
    this.notifications = this.soignantService.getNotificationsTache();
    this.rapportsHebdo = this.soignantService.getRapportsHebdomadaires();
    this.agendaDuJour = this.soignantService.getAgendaDuJour();
    this.alertesNonTraiteesCount = this.alertes.filter(a => a.statut !== 'TRAITEE').length;
    this.rapportsNonLusCount = this.rapports.filter(r => !r.lu).length;
    this.rapportHebdoNonEnvoye = this.rapportsHebdo.some(r => !r.envoyeAuMedecin);
    this.notificationsCount = this.notifications.filter(n => n.statut === 'a_faire').length;
    const today = new Date().toISOString().slice(0, 10);
    this.suiviRempliAujourdhui = this.soignantService.getFormulairesSuiviQuotidien().some(f => f.date === today);
  }

  graviteClass(gravite: GraviteAlerte): string {
    const map: Record<GraviteAlerte, string> = {
      URGENCE: 'gravite-urgence',
      COMPORTEMENT: 'gravite-comportement',
      ZONE_INTERDITE: 'gravite-zone',
    };
    return map[gravite] ?? '';
  }

  graviteLabel(gravite: GraviteAlerte): string {
    const map: Record<GraviteAlerte, string> = {
      URGENCE: this.translate.instant('SOIGNANT.GRAVITY_URGENCE'),
      COMPORTEMENT: this.translate.instant('SOIGNANT.GRAVITY_BEHAVIOUR'),
      ZONE_INTERDITE: this.translate.instant('SOIGNANT.GRAVITY_FORBIDDEN_ZONE'),
    };
    return map[gravite] ?? gravite;
  }

  marquerEnCours(alerte: Alerte): void {
    this.soignantService.marquerAlerteStatut(alerte.id, 'EN_COURS').subscribe(() => this.refresh());
  }

  marquerTraitee(alerte: Alerte): void {
    this.soignantService.marquerAlerteStatut(alerte.id, 'TRAITEE').subscribe(() => this.refresh());
  }



  risqueClass(risque: string): string {
    const map: Record<string, string> = {
      faible: 'risque-faible',
      moyen: 'risque-moyen',
      eleve: 'risque-eleve',
    };
    return map[risque] ?? '';
  }

  formatTime(d: Date): string {
    return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(d: Date | string): string {
    return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  // Rapports médicaux
  marquerRapportLu(rapportId: string): void {
    this.soignantService.marquerRapportLu(rapportId).subscribe(() => this.refresh());
  }

  marquerDirectiveStatut(directiveId: string, statut: StatutDirective): void {
    this.soignantService.marquerDirectiveStatut(directiveId, statut).subscribe(() => this.refresh());
  }

  statutDirectiveLabel(s: StatutDirective): string {
    const map: Record<StatutDirective, string> = { non_lu: this.translate.instant('SOIGNANT.UNREAD'), lu: this.translate.instant('SOIGNANT.READ'), en_cours: this.translate.instant('SOIGNANT.IN_PROGRESS'), execute: this.translate.instant('SOIGNANT.EXECUTED'), reporter: this.translate.instant('SOIGNANT.REPORT') };
    return map[s] ?? s;
  }

  // Notifications
  marquerNotificationFait(notif: NotificationTache): void {
    this.soignantService.marquerNotificationFait(notif.id).subscribe(() => this.refresh());
  }

  marquerNotificationReporter(notif: NotificationTache): void {
    this.soignantService.marquerNotificationReporter(notif.id).subscribe(() => this.refresh());
  }

  marquerNotificationProbleme(notif: NotificationTache): void {
    this.soignantService.marquerNotificationProbleme(notif.id).subscribe(() => this.refresh());
  }

  // Suivi quotidien
  openSuiviQuotidien(patient?: PatientSoignant): void {
    const p = patient ?? this.patients[0];
    if (!p) return;
    this.suiviFormPatientId = p.id;
    const existing = this.soignantService.getFormulaireSuiviDuJour(p.id);
    this.suiviForm = {
      patientId: p.id,
      patientNom: `${p.prenom} ${p.nom}`,

      medicamentsPris: existing?.medicamentsPris ?? '',
      medicamentsRefuses: existing?.medicamentsRefuses ?? '',
      repasConsommes: existing?.repasConsommes ?? '',
      quantiteRepas: existing?.quantiteRepas,
      comportementsObserves: existing?.comportementsObserves ?? '',
      reactionExercicesCognitifs: existing?.reactionExercicesCognitifs ?? '',
      observanceTraitement: (existing?.observanceTraitement as 'oui' | 'partiel' | 'non') ?? 'oui',
      suiviRecommandations: (existing?.suiviRecommandations as 'oui' | 'partiel' | 'non') ?? 'oui',
      evolution: (existing?.evolution as 'amelioration' | 'stabilite' | 'deterioration') ?? 'stabilite',
      commentaires: existing?.commentaires ?? '',
      donepezil: existing?.donepezil ?? '',
      rivastigmine: existing?.rivastigmine ?? '',
      galantamine: existing?.galantamine ?? '',
      memantine: existing?.memantine ?? '',
      effetsMedicamentsObserves: existing?.effetsMedicamentsObserves ?? '',

      tensionArterielle: existing?.tensionArterielle ?? '',
      glycemie: existing?.glycemie ?? '',
      cholesterol: existing?.cholesterol ?? '',
      symptomesStade: existing?.symptomesStade ?? '',
      etatPsychologiqueHumeur: existing?.etatPsychologiqueHumeur ?? '',
      vieSociale: existing?.vieSociale ?? '',
      hygieneVie: existing?.hygieneVie ?? '',
      reponseConseilsMedecin: existing?.reponseConseilsMedecin ?? '',
    };
    this.showSuiviModal = true;
  }

  closeSuiviModal(): void { this.showSuiviModal = false; }

  saveSuiviQuotidien(): void {
    this.soignantService.sauvegarderSuiviQuotidien({
      ...this.suiviForm,
      patientId: this.suiviFormPatientId,
      patientNom: this.suiviForm.patientNom ?? '',
    }).subscribe(() => {
      this.refresh();
      this.closeSuiviModal();
    });
  }

  // Rapport hebdo
  envoyerRapportHebdo(rapportId: string): void {
    this.soignantService.envoyerRapportHebdoAuMedecin(rapportId).subscribe(() => this.refresh());
  }

  // Agenda
  statutAgendaClass(statut: StatutAgenda): string {
    return statut === 'fait' ? 'agenda-fait' : statut === 'en_retard' ? 'agenda-retard' : 'agenda-attente';
  }

  marquerEvenementStatut(ev: EvenementAgenda, statut: StatutAgenda): void {
    this.soignantService.marquerEvenementStatut(ev.id, statut).subscribe(() => this.refresh());
  }

  // SOS / Urgence


  logout(): void {
    this.router.navigate(['/test']);
  }

  isRappelMedicament = isRappelMedicament;
  isRappelRepas = isRappelRepas;
  isRappelRendezVous = isRappelRendezVous;
}
