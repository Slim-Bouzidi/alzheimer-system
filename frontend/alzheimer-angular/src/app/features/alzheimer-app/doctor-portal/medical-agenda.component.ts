import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SidebarComponent } from '../../../shared/sidebar-portal/sidebar.component';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface AgendaPatient {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  telephone?: string;
  email?: string;
  dossierMedical?: string;
}

export type TypeRendezVous = 'consultation' | 'suivi' | 'urgence' | 'teleconsultation' | 'bilan' | 'intervention';

export type StatutRendezVous = 'en_attente' | 'confirme' | 'en_cours' | 'realise' | 'annule' | 'non_honore';

export type PrioriteRendezVous = 'normale' | 'haute' | 'urgente';

export interface RendezVousMedical {
  id: string;
  patient: AgendaPatient;
  type: TypeRendezVous;
  statut: StatutRendezVous;
  priorite: PrioriteRendezVous;
  dateDebut: Date;
  dateFin: Date;
  dureeMinutes: number;
  lieu: string;
  motif: string;
  notesMedicales?: string;
  commentaireMedecin?: string;
  motifAnnulation?: string;
  medecinId: string;
  medecinNom: string;
  creePar: string;
  creeA: Date;
  modifieA?: Date;
  historiqueActions: ActionHistorique[];
}

export interface ActionHistorique {
  id: string;
  action: 'creation' | 'modification' | 'annulation' | 'validation' | 'refus' | 'realisation' | 'commentaire' | 'non_honore';
  date: Date;
  auteur: string;
  details: string;
}

export interface CreneauHoraire {
  heure: string;
  heureNum: number;
  minuteNum: number;
  disponible: boolean;
}

export interface FormulaireRendezVous {
  patientId: string;
  type: TypeRendezVous | '';
  date: string;
  heure: string;
  duree: number;
  lieu: string;
  motif: string;
  notesMedicales: string;
  priorite: PrioriteRendezVous;
}

// ── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-medical-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TranslateModule],
  templateUrl: './medical-agenda.component.html',
  styleUrls: ['./medical-agenda.component.css']
})
export class MedicalAgendaComponent implements OnInit {

  // ─── Médecin connecté ────────────────────────────────────────────────
  medecinNom = 'Dr. Marc Lefebvre';
  medecinId = 'med-001';

  // ─── Navigation & vues ──────────────────────────────────────────────
  currentView: 'jour' | 'semaine' | 'mois' | 'liste' = 'jour';
  activeTab: 'agenda' | 'en_attente' | 'tous' = 'agenda';
  selectedDate: Date = new Date();
  today: Date = new Date();

  // ─── Données ────────────────────────────────────────────────────────
  rendezVous: RendezVousMedical[] = [];
  patients: AgendaPatient[] = [];

  // ─── Créneaux ───────────────────────────────────────────────────────
  creneaux: CreneauHoraire[] = [];
  joursAbrev: string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // ─── Formulaire ─────────────────────────────────────────────────────
  showFormulaire = false;
  isEditing = false;
  editingRdvId: string | null = null;
  formulaire: FormulaireRendezVous = this.getFormulaireVide();

  // ─── Détail RDV ─────────────────────────────────────────────────────
  showDetail = false;
  rdvSelectionne: RendezVousMedical | null = null;

  // ─── Annulation ─────────────────────────────────────────────────────
  showAnnulation = false;
  motifAnnulation = '';

  // ─── Commentaire ────────────────────────────────────────────────────
  showCommentaire = false;
  nouveauCommentaire = '';

  // ─── Historique ─────────────────────────────────────────────────────
  showHistorique = false;

  // ─── Filtres (onglet "Tous") ────────────────────────────────────────
  filtrePatient = '';
  filtreStatut: StatutRendezVous | '' = '';
  filtrePeriodeDebut = '';
  filtrePeriodeFin = '';
  rechercheRapide = '';

  // ─── Confirmation visuelle ──────────────────────────────────────────
  showConfirmation = false;
  confirmationMessage = '';
  confirmationType: 'success' | 'warning' | 'error' = 'success';

  constructor(private router: Router, private translate: TranslateService) {}

  ngOnInit(): void {
    this.genererCreneaux();
    this.chargerDonneesMock();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  INITIALISATION
  // ═══════════════════════════════════════════════════════════════════

  private genererCreneaux(): void {
    this.creneaux = [];
    for (let h = 7; h <= 19; h++) {
      this.creneaux.push({
        heure: `${h.toString().padStart(2, '0')}:00`,
        heureNum: h,
        minuteNum: 0,
        disponible: true
      });
      this.creneaux.push({
        heure: `${h.toString().padStart(2, '0')}:30`,
        heureNum: h,
        minuteNum: 30,
        disponible: true
      });
    }
  }

  private chargerDonneesMock(): void {
    this.patients = [
      { id: 'p1', nom: 'Dupont', prenom: 'Marie', age: 78, telephone: '06 12 34 56 78', email: 'marie.dupont@mail.com' },
      { id: 'p2', nom: 'Martin', prenom: 'Jean', age: 82, telephone: '06 23 45 67 89', email: 'jean.martin@mail.com' },
      { id: 'p3', nom: 'Bernard', prenom: 'Alice', age: 75, telephone: '06 34 56 78 90' },
      { id: 'p4', nom: 'Durand', prenom: 'Paul', age: 85, telephone: '06 45 67 89 01' },
      { id: 'p5', nom: 'Leroy', prenom: 'Sophie', age: 72, telephone: '06 56 78 90 12' },
      { id: 'p6', nom: 'Moreau', prenom: 'Pierre', age: 68, telephone: '06 67 89 01 23' },
      { id: 'p7', nom: 'Robert', prenom: 'Françoise', age: 80, telephone: '06 78 90 12 34' }
    ];

    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    this.rendezVous = [
      // Aujourd'hui
      this.creerRdv('rdv-001', this.patients[0], 'consultation', 'confirme', 'normale',
        new Date(y, m, d, 8, 30), 30, 'Cabinet A', 'Suivi hypertension',
        'Contrôle tension artérielle et ajustement traitement'),
      this.creerRdv('rdv-002', this.patients[1], 'suivi', 'confirme', 'haute',
        new Date(y, m, d, 9, 30), 45, 'Cabinet A', 'Suivi neurologique',
        'Évaluation cognitive trimestrielle'),
      this.creerRdv('rdv-003', this.patients[2], 'consultation', 'en_attente', 'normale',
        new Date(y, m, d, 10, 30), 30, 'Cabinet A', 'Douleurs articulaires',
        undefined),
      this.creerRdv('rdv-004', this.patients[3], 'teleconsultation', 'en_attente', 'normale',
        new Date(y, m, d, 14, 0), 20, 'Téléconsultation', 'Renouvellement ordonnance',
        undefined),
      this.creerRdv('rdv-005', this.patients[4], 'urgence', 'confirme', 'urgente',
        new Date(y, m, d, 15, 0), 30, 'Cabinet B', 'Chute récente',
        'Patient tombé hier soir, vérifier examen radiologique'),
      this.creerRdv('rdv-006', this.patients[5], 'bilan', 'en_attente', 'normale',
        new Date(y, m, d, 16, 0), 60, 'Cabinet A', 'Bilan annuel',
        undefined),

      // Demain
      this.creerRdv('rdv-007', this.patients[6], 'consultation', 'confirme', 'normale',
        new Date(y, m, d + 1, 9, 0), 30, 'Cabinet A', 'Suivi diabète',
        'Contrôle HbA1c'),
      this.creerRdv('rdv-008', this.patients[0], 'suivi', 'confirme', 'haute',
        new Date(y, m, d + 1, 10, 0), 45, 'Cabinet A', 'Résultats analyses',
        undefined),
      this.creerRdv('rdv-009', this.patients[2], 'intervention', 'confirme', 'haute',
        new Date(y, m, d + 1, 14, 30), 60, 'Salle intervention', 'Infiltration genou',
        'Prévoir matériel injection'),

      // Passé (hier)
      this.creerRdv('rdv-010', this.patients[1], 'consultation', 'realise', 'normale',
        new Date(y, m, d - 1, 9, 0), 30, 'Cabinet A', 'Suivi cognitif',
        'MMS réalisé - Score 24/30'),
      this.creerRdv('rdv-011', this.patients[4], 'suivi', 'non_honore', 'normale',
        new Date(y, m, d - 1, 11, 0), 30, 'Cabinet A', 'Suivi post-opératoire',
        undefined),
      this.creerRdv('rdv-012', this.patients[3], 'teleconsultation', 'annule', 'normale',
        new Date(y, m, d - 1, 14, 0), 20, 'Téléconsultation', 'Consultation de suivi',
        undefined),

      // Après-demain
      this.creerRdv('rdv-013', this.patients[5], 'consultation', 'confirme', 'normale',
        new Date(y, m, d + 2, 8, 30), 30, 'Cabinet A', 'Consultation de routine',
        undefined),
      this.creerRdv('rdv-014', this.patients[6], 'bilan', 'en_attente', 'haute',
        new Date(y, m, d + 2, 10, 0), 60, 'Cabinet B', 'Bilan gériatrique',
        undefined),

      // Semaine prochaine
      this.creerRdv('rdv-015', this.patients[0], 'suivi', 'confirme', 'normale',
        new Date(y, m, d + 5, 9, 0), 30, 'Cabinet A', 'Contrôle post-traitement',
        undefined),
      this.creerRdv('rdv-016', this.patients[1], 'bilan', 'confirme', 'normale',
        new Date(y, m, d + 6, 10, 0), 60, 'Cabinet A', 'Bilan complet',
        undefined),
    ];
  }

  private creerRdv(
    id: string, patient: AgendaPatient, type: TypeRendezVous,
    statut: StatutRendezVous, priorite: PrioriteRendezVous,
    dateDebut: Date, dureeMin: number, lieu: string, motif: string,
    notes?: string
  ): RendezVousMedical {
    const dateFin = new Date(dateDebut.getTime() + dureeMin * 60000);
    return {
      id, patient, type, statut, priorite,
      dateDebut, dateFin,
      dureeMinutes: dureeMin, lieu, motif,
      notesMedicales: notes,
      medecinId: this.medecinId,
      medecinNom: this.medecinNom,
      creePar: this.medecinNom,
      creeA: new Date(dateDebut.getTime() - 86400000 * 3),
      historiqueActions: [{
        id: `act-${id}-1`,
        action: 'creation',
        date: new Date(dateDebut.getTime() - 86400000 * 3),
        auteur: this.medecinNom,
        details: this.translate.instant('MEDICAL_AGENDA.HISTORY_CREATED', { type: this.getTypeLabel(type), patient: `${patient.prenom} ${patient.nom}` })
      }]
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  NAVIGATION TEMPORELLE
  // ═══════════════════════════════════════════════════════════════════

  allerAujourdhui(): void {
    this.selectedDate = new Date();
  }

  periodePrecedente(): void {
    const d = new Date(this.selectedDate);
    if (this.currentView === 'jour') d.setDate(d.getDate() - 1);
    else if (this.currentView === 'semaine') d.setDate(d.getDate() - 7);
    else if (this.currentView === 'mois') d.setMonth(d.getMonth() - 1);
    this.selectedDate = d;
  }

  periodeSuivante(): void {
    const d = new Date(this.selectedDate);
    if (this.currentView === 'jour') d.setDate(d.getDate() + 1);
    else if (this.currentView === 'semaine') d.setDate(d.getDate() + 7);
    else if (this.currentView === 'mois') d.setMonth(d.getMonth() + 1);
    this.selectedDate = d;
  }

  allerADate(date: Date): void {
    this.selectedDate = date;
    this.currentView = 'jour';
    this.activeTab = 'agenda';
  }

  // ═══════════════════════════════════════════════════════════════════
  //  GETTERS POUR LES VUES
  // ═══════════════════════════════════════════════════════════════════

  get titrePeriode(): string {
    const d = this.selectedDate;
    const opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    if (this.currentView === 'jour') return d.toLocaleDateString('fr-FR', opts);
    if (this.currentView === 'semaine') {
      const debut = this.getDebutSemaine(d);
      const fin = new Date(debut);
      fin.setDate(fin.getDate() + 6);
      return `${debut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${fin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  get rdvAujourdhui(): RendezVousMedical[] {
    return this.getRdvPourDate(this.selectedDate)
      .sort((a, b) => a.dateDebut.getTime() - b.dateDebut.getTime());
  }

  get rdvEnAttente(): RendezVousMedical[] {
    return this.rendezVous
      .filter(r => r.statut === 'en_attente')
      .sort((a, b) => a.dateDebut.getTime() - b.dateDebut.getTime());
  }

  get rdvFiltres(): RendezVousMedical[] {
    let liste = [...this.rendezVous];

    if (this.filtrePatient) {
      liste = liste.filter(r => r.patient.id === this.filtrePatient);
    }
    if (this.filtreStatut) {
      liste = liste.filter(r => r.statut === this.filtreStatut);
    }
    if (this.filtrePeriodeDebut) {
      const debut = new Date(this.filtrePeriodeDebut);
      liste = liste.filter(r => r.dateDebut >= debut);
    }
    if (this.filtrePeriodeFin) {
      const fin = new Date(this.filtrePeriodeFin);
      fin.setHours(23, 59, 59);
      liste = liste.filter(r => r.dateDebut <= fin);
    }
    if (this.rechercheRapide.trim()) {
      const q = this.rechercheRapide.toLowerCase();
      liste = liste.filter(r =>
        r.patient.nom.toLowerCase().includes(q) ||
        r.patient.prenom.toLowerCase().includes(q) ||
        r.motif.toLowerCase().includes(q) ||
        r.lieu.toLowerCase().includes(q) ||
        this.getTypeLabel(r.type).toLowerCase().includes(q)
      );
    }

    return liste.sort((a, b) => b.dateDebut.getTime() - a.dateDebut.getTime());
  }

  // ─── Statistiques header ────────────────────────────────────────────
  get statsAujourdhui(): number {
    return this.getRdvPourDate(new Date()).length;
  }

  get statsEnAttente(): number {
    return this.rendezVous.filter(r => r.statut === 'en_attente').length;
  }

  get statsConfirmes(): number {
    return this.getRdvPourDate(new Date()).filter(r => r.statut === 'confirme').length;
  }

  get statsUrgences(): number {
    return this.rendezVous.filter(r =>
      r.priorite === 'urgente' && (r.statut === 'confirme' || r.statut === 'en_attente')
    ).length;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  VUE SEMAINE
  // ═══════════════════════════════════════════════════════════════════

  getDebutSemaine(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  getDatesSemaine(): Date[] {
    const debut = this.getDebutSemaine(this.selectedDate);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(debut);
      d.setDate(debut.getDate() + i);
      dates.push(d);
    }
    return dates;
  }

  getRdvPourCreneau(date: Date, creneau: CreneauHoraire): RendezVousMedical[] {
    return this.getRdvPourDate(date).filter(r => {
      const h = r.dateDebut.getHours();
      const min = r.dateDebut.getMinutes();
      return h === creneau.heureNum && min >= creneau.minuteNum && min < creneau.minuteNum + 30;
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  VUE MOIS
  // ═══════════════════════════════════════════════════════════════════

  getSemainesDuMois(): Date[][] {
    const premierJour = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
    const dernierJour = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 0);

    const debutGrille = this.getDebutSemaine(premierJour);
    const semaines: Date[][] = [];
    let courant = new Date(debutGrille);

    while (courant <= dernierJour || semaines.length < 5) {
      const semaine: Date[] = [];
      for (let i = 0; i < 7; i++) {
        semaine.push(new Date(courant));
        courant.setDate(courant.getDate() + 1);
      }
      semaines.push(semaine);
      if (semaines.length >= 6) break;
    }
    return semaines;
  }

  estMoisCourant(date: Date): boolean {
    return date.getMonth() === this.selectedDate.getMonth();
  }

  estAujourdhui(date: Date): boolean {
    return date.toDateString() === this.today.toDateString();
  }

  estDateSelectionnee(date: Date): boolean {
    return date.toDateString() === this.selectedDate.toDateString();
  }

  getRdvPourDate(date: Date): RendezVousMedical[] {
    return this.rendezVous.filter(r =>
      r.dateDebut.toDateString() === date.toDateString()
    );
  }

  getNombreRdvParStatut(date: Date, statut: StatutRendezVous): number {
    return this.getRdvPourDate(date).filter(r => r.statut === statut).length;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  FORMULAIRE : Planifier / Modifier un RDV
  // ═══════════════════════════════════════════════════════════════════

  ouvrirFormulaire(creneau?: CreneauHoraire): void {
    this.formulaire = this.getFormulaireVide();
    if (creneau) {
      this.formulaire.heure = creneau.heure;
      this.formulaire.date = this.formatDateInput(this.selectedDate);
    }
    this.isEditing = false;
    this.editingRdvId = null;
    this.showFormulaire = true;
  }

  ouvrirFormulaireModification(rdv: RendezVousMedical): void {
    this.formulaire = {
      patientId: rdv.patient.id,
      type: rdv.type,
      date: this.formatDateInput(rdv.dateDebut),
      heure: `${rdv.dateDebut.getHours().toString().padStart(2, '0')}:${rdv.dateDebut.getMinutes().toString().padStart(2, '0')}`,
      duree: rdv.dureeMinutes,
      lieu: rdv.lieu,
      motif: rdv.motif,
      notesMedicales: rdv.notesMedicales || '',
      priorite: rdv.priorite
    };
    this.isEditing = true;
    this.editingRdvId = rdv.id;
    this.showFormulaire = true;
    this.showDetail = false;
  }

  fermerFormulaire(): void {
    this.showFormulaire = false;
    this.formulaire = this.getFormulaireVide();
  }

  sauvegarderRdv(): void {
    if (!this.isFormulaireValide()) return;

    const patient = this.patients.find(p => p.id === this.formulaire.patientId);
    if (!patient) return;

    const [heures, minutes] = this.formulaire.heure.split(':').map(Number);
    const dateDebut = new Date(this.formulaire.date + 'T00:00:00');
    dateDebut.setHours(heures, minutes, 0, 0);
    const dateFin = new Date(dateDebut.getTime() + this.formulaire.duree * 60000);

    if (this.isEditing && this.editingRdvId) {
      // Modification
      const rdv = this.rendezVous.find(r => r.id === this.editingRdvId);
      if (rdv) {
        rdv.patient = patient;
        rdv.type = this.formulaire.type as TypeRendezVous;
        rdv.dateDebut = dateDebut;
        rdv.dateFin = dateFin;
        rdv.dureeMinutes = this.formulaire.duree;
        rdv.lieu = this.formulaire.lieu;
        rdv.motif = this.formulaire.motif;
        rdv.notesMedicales = this.formulaire.notesMedicales || undefined;
        rdv.priorite = this.formulaire.priorite;
        rdv.modifieA = new Date();
        rdv.historiqueActions.push({
          id: `act-${rdv.id}-${rdv.historiqueActions.length + 1}`,
          action: 'modification',
          date: new Date(),
          auteur: this.medecinNom,
          details: this.translate.instant('MEDICAL_AGENDA.HISTORY_MODIFIED', { type: this.getTypeLabel(rdv.type), date: dateDebut.toLocaleDateString('fr-FR'), time: this.formulaire.heure })
        });
        this.afficherConfirmation(this.translate.instant('MEDICAL_AGENDA.CONFIRMATION_MODIFIED'), 'success');
      }
    } else {
      // Création
      const newId = 'rdv-' + String(Date.now());
      const newRdv: RendezVousMedical = {
        id: newId,
        patient,
        type: this.formulaire.type as TypeRendezVous,
        statut: 'confirme',
        priorite: this.formulaire.priorite,
        dateDebut,
        dateFin,
        dureeMinutes: this.formulaire.duree,
        lieu: this.formulaire.lieu,
        motif: this.formulaire.motif,
        notesMedicales: this.formulaire.notesMedicales || undefined,
        medecinId: this.medecinId,
        medecinNom: this.medecinNom,
        creePar: this.medecinNom,
        creeA: new Date(),
        historiqueActions: [{
          id: `act-${newId}-1`,
          action: 'creation',
          date: new Date(),
          auteur: this.medecinNom,
          details: this.translate.instant('MEDICAL_AGENDA.HISTORY_CREATED', { type: this.getTypeLabel(this.formulaire.type as TypeRendezVous), patient: `${patient.prenom} ${patient.nom}` })
        }]
      };
      this.rendezVous.push(newRdv);
      this.afficherConfirmation(this.translate.instant('MEDICAL_AGENDA.CONFIRMATION_PLANNED'), 'success');
    }

    this.fermerFormulaire();
  }

  isFormulaireValide(): boolean {
    return !!(
      this.formulaire.patientId &&
      this.formulaire.type &&
      this.formulaire.date &&
      this.formulaire.heure &&
      this.formulaire.motif &&
      this.formulaire.lieu &&
      this.formulaire.duree > 0
    );
  }

  private getFormulaireVide(): FormulaireRendezVous {
    return {
      patientId: '',
      type: '',
      date: this.formatDateInput(new Date()),
      heure: '',
      duree: 30,
      lieu: 'Cabinet A',
      motif: '',
      notesMedicales: '',
      priorite: 'normale'
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  GESTION DES RDV EN ATTENTE
  // ═══════════════════════════════════════════════════════════════════

  accepterRdv(rdv: RendezVousMedical): void {
    rdv.statut = 'confirme';
    rdv.modifieA = new Date();
    rdv.historiqueActions.push({
      id: `act-${rdv.id}-${rdv.historiqueActions.length + 1}`,
      action: 'validation',
      date: new Date(),
      auteur: this.medecinNom,
      details: this.translate.instant('MEDICAL_AGENDA.HISTORY_ACCEPTED')
    });
    this.afficherConfirmation(this.translate.instant('MEDICAL_AGENDA.CONFIRMATION_ACCEPTED', { patient: `${rdv.patient.prenom} ${rdv.patient.nom}` }), 'success');
  }

  refuserRdv(rdv: RendezVousMedical): void {
    rdv.statut = 'annule';
    rdv.motifAnnulation = this.translate.instant('MEDICAL_AGENDA.HISTORY_DECLINED_REASON');
    rdv.modifieA = new Date();
    rdv.historiqueActions.push({
      id: `act-${rdv.id}-${rdv.historiqueActions.length + 1}`,
      action: 'refus',
      date: new Date(),
      auteur: this.medecinNom,
      details: this.translate.instant('MEDICAL_AGENDA.HISTORY_DECLINED')
    });
    this.afficherConfirmation(this.translate.instant('MEDICAL_AGENDA.CONFIRMATION_DECLINED', { patient: `${rdv.patient.prenom} ${rdv.patient.nom}` }), 'warning');
  }

  modifierRdvEnAttente(rdv: RendezVousMedical): void {
    this.ouvrirFormulaireModification(rdv);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  GESTION DES RDV EXISTANTS
  // ═══════════════════════════════════════════════════════════════════

  ouvrirDetail(rdv: RendezVousMedical): void {
    this.rdvSelectionne = rdv;
    this.showDetail = true;
    this.showAnnulation = false;
    this.showCommentaire = false;
    this.showHistorique = false;
  }

  fermerDetail(): void {
    this.showDetail = false;
    this.rdvSelectionne = null;
    this.showAnnulation = false;
    this.showCommentaire = false;
    this.showHistorique = false;
    this.motifAnnulation = '';
    this.nouveauCommentaire = '';
  }

  marquerRealise(rdv: RendezVousMedical): void {
    rdv.statut = 'realise';
    rdv.modifieA = new Date();
    rdv.historiqueActions.push({
      id: `act-${rdv.id}-${rdv.historiqueActions.length + 1}`,
      action: 'realisation',
      date: new Date(),
      auteur: this.medecinNom,
      details: this.translate.instant('MEDICAL_AGENDA.HISTORY_COMPLETED')
    });
    this.afficherConfirmation(this.translate.instant('MEDICAL_AGENDA.CONFIRMATION_COMPLETED'), 'success');
  }

  marquerNonHonore(rdv: RendezVousMedical): void {
    rdv.statut = 'non_honore';
    rdv.modifieA = new Date();
    rdv.historiqueActions.push({
      id: `act-${rdv.id}-${rdv.historiqueActions.length + 1}`,
      action: 'non_honore',
      date: new Date(),
      auteur: this.medecinNom,
      details: this.translate.instant('MEDICAL_AGENDA.HISTORY_NO_SHOW')
    });
    this.afficherConfirmation(this.translate.instant('MEDICAL_AGENDA.CONFIRMATION_NO_SHOW'), 'warning');
  }

  ouvrirAnnulation(): void {
    this.showAnnulation = true;
    this.motifAnnulation = '';
  }

  confirmerAnnulation(rdv: RendezVousMedical): void {
    if (!this.motifAnnulation.trim()) return;
    rdv.statut = 'annule';
    rdv.motifAnnulation = this.motifAnnulation;
    rdv.modifieA = new Date();
    rdv.historiqueActions.push({
      id: `act-${rdv.id}-${rdv.historiqueActions.length + 1}`,
      action: 'annulation',
      date: new Date(),
      auteur: this.medecinNom,
      details: this.translate.instant('MEDICAL_AGENDA.HISTORY_CANCELLED', { reason: this.motifAnnulation })
    });
    this.showAnnulation = false;
    this.motifAnnulation = '';
    this.afficherConfirmation(this.translate.instant('MEDICAL_AGENDA.CONFIRMATION_CANCELLED'), 'error');
  }

  ouvrirCommentaire(): void {
    this.showCommentaire = true;
    this.nouveauCommentaire = '';
  }

  ajouterCommentaire(rdv: RendezVousMedical): void {
    if (!this.nouveauCommentaire.trim()) return;
    rdv.commentaireMedecin = this.nouveauCommentaire;
    rdv.modifieA = new Date();
    rdv.historiqueActions.push({
      id: `act-${rdv.id}-${rdv.historiqueActions.length + 1}`,
      action: 'commentaire',
      date: new Date(),
      auteur: this.medecinNom,
      details: this.translate.instant('MEDICAL_AGENDA.HISTORY_COMMENT', { comment: this.nouveauCommentaire })
    });
    this.showCommentaire = false;
    this.nouveauCommentaire = '';
    this.afficherConfirmation(this.translate.instant('MEDICAL_AGENDA.CONFIRMATION_COMMENT'), 'success');
  }

  toggleHistorique(): void {
    this.showHistorique = !this.showHistorique;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  UTILITAIRES D'AFFICHAGE
  // ═══════════════════════════════════════════════════════════════════

  getTypeLabel(type: TypeRendezVous | string): string {
    const labels: Record<string, string> = {
      consultation: this.translate.instant('MEDICAL_AGENDA.TYPE_LABEL_CONSULTATION'),
      suivi: this.translate.instant('MEDICAL_AGENDA.TYPE_LABEL_SUIVI'),
      urgence: this.translate.instant('MEDICAL_AGENDA.TYPE_LABEL_URGENCE'),
      teleconsultation: this.translate.instant('MEDICAL_AGENDA.TYPE_LABEL_TELECONSULTATION'),
      bilan: this.translate.instant('MEDICAL_AGENDA.TYPE_LABEL_BILAN'),
      intervention: this.translate.instant('MEDICAL_AGENDA.TYPE_LABEL_INTERVENTION')
    };
    return labels[type] || type;
  }

  getTypeIcon(type: TypeRendezVous): string {
    const icons: Record<string, string> = {
      consultation: '🩺',
      suivi: '📋',
      urgence: '🚨',
      teleconsultation: '💻',
      bilan: '📊',
      intervention: '⚕️'
    };
    return icons[type] || '📅';
  }

  getStatutLabel(statut: StatutRendezVous): string {
    const labels: Record<string, string> = {
      en_attente: this.translate.instant('MEDICAL_AGENDA.STATUS_PENDING'),
      confirme: this.translate.instant('MEDICAL_AGENDA.STATUS_CONFIRMED'),
      en_cours: this.translate.instant('MEDICAL_AGENDA.STATUS_IN_PROGRESS'),
      realise: this.translate.instant('MEDICAL_AGENDA.STATUS_COMPLETED'),
      annule: this.translate.instant('MEDICAL_AGENDA.STATUS_CANCELLED'),
      non_honore: this.translate.instant('MEDICAL_AGENDA.STATUS_NO_SHOW')
    };
    return labels[statut] || statut;
  }

  getStatutClass(statut: StatutRendezVous): string {
    return `statut-${statut}`;
  }

  getTypeClass(type: TypeRendezVous): string {
    return `type-${type}`;
  }

  getPrioriteLabel(priorite: PrioriteRendezVous): string {
    const labels: Record<string, string> = {
      normale: this.translate.instant('MEDICAL_AGENDA.PRIORITY_NORMAL'),
      haute: this.translate.instant('MEDICAL_AGENDA.PRIORITY_HIGH'),
      urgente: this.translate.instant('MEDICAL_AGENDA.PRIORITY_URGENT')
    };
    return labels[priorite] || priorite;
  }

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      creation: this.translate.instant('MEDICAL_AGENDA.ACTION_CREATION'),
      modification: this.translate.instant('MEDICAL_AGENDA.ACTION_MODIFICATION'),
      annulation: this.translate.instant('MEDICAL_AGENDA.ACTION_CANCELLATION'),
      validation: this.translate.instant('MEDICAL_AGENDA.ACTION_VALIDATION'),
      refus: this.translate.instant('MEDICAL_AGENDA.ACTION_REFUSAL'),
      realisation: this.translate.instant('MEDICAL_AGENDA.ACTION_COMPLETION'),
      commentaire: this.translate.instant('MEDICAL_AGENDA.ACTION_COMMENT'),
      non_honore: this.translate.instant('MEDICAL_AGENDA.ACTION_NO_SHOW')
    };
    return labels[action] || action;
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      creation: '➕',
      modification: '✏️',
      annulation: '❌',
      validation: '✅',
      refus: '🚫',
      realisation: '✔️',
      commentaire: '💬',
      non_honore: '⚠️'
    };
    return icons[action] || '📌';
  }

  getDelaiAttente(rdv: RendezVousMedical): string {
    const now = new Date();
    const diff = rdv.dateDebut.getTime() - now.getTime();
    if (diff < 0) return this.translate.instant('MEDICAL_AGENDA.DELAY_EXCEEDED');
    const jours = Math.floor(diff / 86400000);
    const heures = Math.floor((diff % 86400000) / 3600000);
    if (jours > 0) return `${jours}j ${heures}h`;
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (heures > 0) return `${heures}h ${minutes}min`;
    return `${minutes} min`;
  }

  formatDateInput(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  isCreneauOccupe(date: Date, creneau: CreneauHoraire): boolean {
    return this.getRdvPourCreneau(date, creneau).length > 0;
  }

  creneauClickJour(creneau: CreneauHoraire): void {
    if (!this.isCreneauOccupe(this.selectedDate, creneau)) {
      this.ouvrirFormulaire(creneau);
    }
  }

  creneauClickSemaine(date: Date, creneau: CreneauHoraire): void {
    if (!this.isCreneauOccupe(date, creneau)) {
      this.selectedDate = date;
      this.ouvrirFormulaire(creneau);
    }
  }

  peutModifier(rdv: RendezVousMedical): boolean {
    return rdv.statut === 'confirme' || rdv.statut === 'en_attente';
  }

  peutAnnuler(rdv: RendezVousMedical): boolean {
    return rdv.statut !== 'annule' && rdv.statut !== 'realise' && rdv.statut !== 'non_honore';
  }

  peutMarquerRealise(rdv: RendezVousMedical): boolean {
    return rdv.statut === 'confirme' || rdv.statut === 'en_cours';
  }

  peutMarquerNonHonore(rdv: RendezVousMedical): boolean {
    return rdv.statut === 'confirme';
  }

  // ─── Confirmation ───────────────────────────────────────────────────
  private afficherConfirmation(message: string, type: 'success' | 'warning' | 'error'): void {
    this.confirmationMessage = message;
    this.confirmationType = type;
    this.showConfirmation = true;
    setTimeout(() => this.showConfirmation = false, 3500);
  }

  // ─── Réinitialiser filtres ──────────────────────────────────────────
  reinitialiserFiltres(): void {
    this.filtrePatient = '';
    this.filtreStatut = '';
    this.filtrePeriodeDebut = '';
    this.filtrePeriodeFin = '';
    this.rechercheRapide = '';
  }

  // ─── Navigation ─────────────────────────────────────────────────────
  retourDashboard(): void {
    this.router.navigate(['/doctor-dashboard']);
  }

  logout(): void {
    this.router.navigate(['/test']);
  }
}
