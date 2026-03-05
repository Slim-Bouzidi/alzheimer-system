import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { RapportService, Rapport } from '../services/rapport.service';
import { PatientService, Patient } from '../services/patient.service';
import { TraitementApiService, TraitementPayload } from '../services/traitement-api.service';
import { EvenementAgendaApiService } from '../services/evenement-agenda-api.service';
import { TraitementPrescrit, MomentPrise } from '../models/rapport-suivi-structure.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import keycloak from '../keycloak';
import { sanitizeInput, FormValidator, ValidationErrors } from '../shared/validation.utils';

interface PatientOption {
  id: number;
  name: string;
  age: number;
}

@Component({
  selector: 'app-doctor-report-create',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TranslateModule],
  templateUrl: './doctor-report-create.component.html',
  styleUrls: ['./doctor-report-create.component.css']
})
export class DoctorReportCreateComponent implements OnInit {
  patients: PatientOption[] = [];

  selectedPatient: PatientOption | null = null;
  medecinNom = keycloak.tokenParsed?.['name'] || keycloak.tokenParsed?.['preferred_username'] || 'Médecin';

  /** Période du suivi hebdomadaire (7 jours) — format YYYY-MM-DD pour input date */
  dateDebut: string;
  dateFin: string;

  // Observance médicamenteuse — prérempli avec valeurs standard
  traitements: Array<Partial<TraitementPrescrit> & { momentPrise: MomentPrise }> = [
    { id: 't1', nom: '', dosage: '', momentPrise: 'matin', attentesSuivi: '' }
  ];
  attentesGenerales = '';

  // Alimentation / hydratation
  directivesAlim: Array<{ id: string; libelle: string; detail: string }> = [
    { id: 'd1', libelle: '', detail: '' }
  ];

  // Vie sociale / hygiène
  directivesVieSociale: Array<{ id: string; libelle: string; detail: string }> = [
    { id: 'd2', libelle: '', detail: '' }
  ];

  signatureValide = false;
  submitting = false;
  errorMessage = '';
  formErrors: ValidationErrors = {};
  /** Bloc à mettre en évidence en cas d'erreur de validation (scroll + style) */
  errorBlockId: 'identity' | 'observance' | 'directives' | 'period' | 'validation' | null = null;

  constructor(
    private router: Router,
    private rapportService: RapportService,
    private patientService: PatientService,
    private traitementApi: TraitementApiService,
    private agendaApi: EvenementAgendaApiService,
    private translate: TranslateService
  ) {
    const today = new Date();
    this.dateDebut = this.formatDateForInput(today);
    const fin = new Date(today);
    fin.setDate(fin.getDate() + 6);
    this.dateFin = this.formatDateForInput(fin);
    this.traitements[0].attentesSuivi = this.translate.instant('DOCTOR_REPORT_CREATE.DEFAULT_MONITORING_EXPECTATION');
    this.attentesGenerales = this.translate.instant('DOCTOR_REPORT_CREATE.DEFAULT_GENERAL_EXPECTATION');
  }

  private formatDateForInput(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  ngOnInit(): void {
    this.patientService.getAll().subscribe({
      next: (patients: Patient[]) => {
        this.patients = patients.map(p => ({
          id: p.id!,
          name: p.nomComplet || '',
          age: this.calculateAge(p.dateNaissance)
        }));
      },
      error: (err) => console.error('Erreur chargement patients:', err)
    });
  }

  private calculateAge(dateNaissance?: string): number {
    if (!dateNaissance) return 0;
    const birth = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  /** Nombre de jours de la période (pour affichage) */
  get periodeJours(): number {
    if (!this.dateDebut || !this.dateFin) return 0;
    const deb = new Date(this.dateDebut);
    const fin = new Date(this.dateFin);
    return Math.round((fin.getTime() - deb.getTime()) / (24 * 3600 * 1000)) + 1;
  }

  selectPatient(p: PatientOption): void {
    this.selectedPatient = p;
  }

  addTraitement(): void {
    this.traitements.push({
      id: 't' + (this.traitements.length + 1),
      nom: '',
      dosage: '',
      momentPrise: 'matin',
      attentesSuivi: this.translate.instant('DOCTOR_REPORT_CREATE.DEFAULT_MONITORING_EXPECTATION')
    });
  }

  removeTraitement(index: number): void {
    if (this.traitements.length > 1) this.traitements.splice(index, 1);
  }

  /** Dupliquer une ligne de traitement (même médicament à un autre moment, etc.) */
  duplicateTraitement(index: number): void {
    const source = this.traitements[index];
    this.traitements.splice(index + 1, 0, {
      id: 't' + (this.traitements.length + 1),
      nom: source.nom ?? '',
      dosage: source.dosage ?? '',
      momentPrise: source.momentPrise ?? 'matin',
      attentesSuivi: source.attentesSuivi ?? this.translate.instant('DOCTOR_REPORT_CREATE.DEFAULT_MONITORING_EXPECTATION')
    });
  }

  addDirectiveAlim(): void {
    this.directivesAlim.push({
      id: 'da' + (this.directivesAlim.length + 1),
      libelle: '',
      detail: ''
    });
  }

  removeDirectiveAlim(index: number): void {
    if (this.directivesAlim.length > 1) this.directivesAlim.splice(index, 1);
  }

  addDirectiveVieSociale(): void {
    this.directivesVieSociale.push({
      id: 'dv' + (this.directivesVieSociale.length + 1),
      libelle: '',
      detail: ''
    });
  }

  removeDirectiveVieSociale(index: number): void {
    if (this.directivesVieSociale.length > 1) this.directivesVieSociale.splice(index, 1);
  }

  /** Fait défiler la page vers un bloc (pour erreur de validation) */
  private scrollToBlock(blockId: string): void {
    setTimeout(() => {
      const el = document.getElementById(blockId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  /** Nombre d'éléments remplis pour le résumé avant envoi */
  get summaryCounts(): { traitements: number; alim: number; vie: number } {
    return {
      traitements: this.traitements.filter(t => t.nom?.trim()).length,
      alim: this.directivesAlim.filter(d => d.libelle.trim()).length,
      vie: this.directivesVieSociale.filter(d => d.libelle.trim()).length
    };
  }

  /** Clear a single field error (called on input change for real-time feedback) */
  clearFieldError(field: string): void {
    if (this.formErrors[field]) {
      const { [field]: _, ...rest } = this.formErrors;
      this.formErrors = rest;
    }
  }

  submit(): void {
    try {
      this.errorMessage = '';
      this.errorBlockId = null;
      this.formErrors = {};

    // ── 1. Patient selection ──
    if (!this.selectedPatient) {
      this.formErrors['patient'] = this.translate.instant('DOCTOR_REPORT_CREATE.SELECT_PATIENT_ERROR');
      this.errorMessage = this.formErrors['patient'];
      this.errorBlockId = 'identity';
      this.scrollToBlock('block-identity');
      return;
    }

    // ── 2. Period validation ──
    const vPeriod = new FormValidator()
      .required('dateDebut', this.dateDebut, 'La date de début est requise.')
      .required('dateFin', this.dateFin, 'La date de fin est requise.');

    if (this.dateDebut && this.dateFin) {
      const dateDeb = new Date(this.dateDebut);
      const dateFinR = new Date(this.dateFin);

      // End date must be >= start date
      if (dateFinR < dateDeb) {
        vPeriod.custom('dateFin', true, this.translate.instant('DOCTOR_REPORT_CREATE.DATE_END_ERROR'));
      }

      // Period cannot exceed 90 days
      const daysDiff = Math.round((dateFinR.getTime() - dateDeb.getTime()) / (24 * 3600 * 1000)) + 1;
      if (daysDiff > 90) {
        vPeriod.custom('dateFin', true, 'La période ne peut pas dépasser 90 jours.');
      }

      // Dates cannot be more than 1 year in the future
      const maxFuture = new Date();
      maxFuture.setFullYear(maxFuture.getFullYear() + 1);
      if (dateFinR > maxFuture) {
        vPeriod.custom('dateFin', true, 'La date de fin ne peut pas dépasser un an dans le futur.');
      }
      if (dateDeb > maxFuture) {
        vPeriod.custom('dateDebut', true, 'La date de début ne peut pas dépasser un an dans le futur.');
      }
    }

    if (vPeriod.hasErrors()) {
      this.formErrors = { ...this.formErrors, ...vPeriod.errors };
      this.errorMessage = Object.values(vPeriod.errors)[0];
      this.errorBlockId = 'period';
      this.scrollToBlock('block-period');
      return;
    }

    // ── 3. Treatments validation ──
    const vTreat = new FormValidator();
    this.traitements.forEach((t, i) => {
      if (t.nom?.trim()) {
        vTreat.maxLength(`nom_${i}`, t.nom!, 200, `Médicament ${i + 1} : nom trop long (max 200 car.).`);
        if (t.nom!.trim().length < 2) {
          vTreat.custom(`nom_${i}`, true, `Médicament ${i + 1} : nom trop court (min 2 car.).`);
        }
        // Dosage obligatoire si nom renseigné
        if (t.dosage === undefined || t.dosage === null || t.dosage === '' || (typeof t.dosage === 'string' && t.dosage.trim() === '')) {
          vTreat.custom(`dosage_${i}`, true, `Médicament ${i + 1} : le dosage est requis.`);
        } else {
          // Check if dosage is integer and positive
          const dosageValue = Number(t.dosage);
          if (!Number.isInteger(dosageValue) || dosageValue < 1) {
            vTreat.custom(`dosage_${i}`, true, `Médicament ${i + 1} : le dosage doit être un entier positif.`);
          }
        }
        vTreat.maxLength(`dosage_${i}`, t.dosage ? t.dosage.toString() : '', 100, `Médicament ${i + 1} : dosage trop long (max 100 car.).`);
        vTreat.maxLength(`attentes_${i}`, t.attentesSuivi || '', 500, `Médicament ${i + 1} : attentes trop longues (max 500 car.).`);
      }
    });

    const traitementsValides = this.traitements
      .filter(t => t.nom?.trim())
      .map((t, i) => ({
        id: t.id || 't' + (i + 1),
        nom: sanitizeInput(t.nom!.trim()),
        dosage: sanitizeInput(String(t.dosage ?? '').trim()),
        momentPrise: t.momentPrise || 'matin',
        detail: (t as TraitementPrescrit).detail?.trim(),
        attentesSuivi: sanitizeInput((t.attentesSuivi || '').trim()) || this.translate.instant('DOCTOR_REPORT_CREATE.DEFAULT_MONITORING_EXPECTATION')
      }));

    if (traitementsValides.length === 0) {
      this.formErrors['traitements'] = this.translate.instant('DOCTOR_REPORT_CREATE.TREATMENT_REQUIRED_ERROR');
      this.errorMessage = this.formErrors['traitements'];
      this.errorBlockId = 'observance';
      this.scrollToBlock('block-observance');
      return;
    }

    if (vTreat.hasErrors()) {
      this.formErrors = { ...this.formErrors, ...vTreat.errors };
      this.errorMessage = Object.values(vTreat.errors)[0];
      this.errorBlockId = 'observance';
      this.scrollToBlock('block-observance');
      return;
    }

    // ── 4. Attentes générales ──
    const vGen = new FormValidator()
      .maxLength('attentesGenerales', this.attentesGenerales, 2000, 'Attentes générales trop longues (max 2000 car.).');
    if (vGen.hasErrors()) {
      this.formErrors = { ...this.formErrors, ...vGen.errors };
      this.errorMessage = Object.values(vGen.errors)[0];
      this.errorBlockId = 'observance';
      this.scrollToBlock('block-observance');
      return;
    }

    // ── 5. Directives alimentation ──
    const vAlim = new FormValidator();
    this.directivesAlim.forEach((d, i) => {
      if (d.libelle.trim()) {
        vAlim.maxLength(`alim_lib_${i}`, d.libelle, 300, `Directive alimentation ${i + 1} : libellé trop long (max 300 car.).`);
        vAlim.maxLength(`alim_det_${i}`, d.detail, 500, `Directive alimentation ${i + 1} : détail trop long (max 500 car.).`);
      }
    });
    if (vAlim.hasErrors()) {
      this.formErrors = { ...this.formErrors, ...vAlim.errors };
      this.errorMessage = Object.values(vAlim.errors)[0];
      this.errorBlockId = 'directives';
      this.scrollToBlock('heading-alim');
      return;
    }

    // ── 6. Directives vie sociale ──
    const vVie = new FormValidator();
    this.directivesVieSociale.forEach((d, i) => {
      if (d.libelle.trim()) {
        vVie.maxLength(`vs_lib_${i}`, d.libelle, 300, `Directive vie sociale ${i + 1} : libellé trop long (max 300 car.).`);
        vVie.maxLength(`vs_det_${i}`, d.detail, 500, `Directive vie sociale ${i + 1} : détail trop long (max 500 car.).`);
      }
    });
    if (vVie.hasErrors()) {
      this.formErrors = { ...this.formErrors, ...vVie.errors };
      this.errorMessage = Object.values(vVie.errors)[0];
      this.errorBlockId = 'directives';
      this.scrollToBlock('heading-vie');
      return;
    }

    // ── 7. Signature ──
    if (!this.signatureValide) {
      this.formErrors['signatureValide'] = this.translate.instant('DOCTOR_REPORT_CREATE.VALIDATION_CHECKBOX_ERROR');
      this.errorMessage = this.formErrors['signatureValide'];
      this.errorBlockId = 'validation';
      this.scrollToBlock('block-validation');
      return;
    }

    // ── Build and send rapport ──
    const contenuTraitements = traitementsValides.map(t =>
      `${t.nom} (${t.dosage}) — ${t.momentPrise} : ${t.attentesSuivi}`
    ).join('\n');

    const directivesAlimTexte = this.directivesAlim
      .filter(d => d.libelle.trim())
      .map(d => `[Alimentation] ${sanitizeInput(d.libelle.trim())}${d.detail.trim() ? ' — ' + sanitizeInput(d.detail.trim()) : ''}`)
      .join('\n');
    const directivesVieTexte = this.directivesVieSociale
      .filter(d => d.libelle.trim())
      .map(d => `[Vie sociale] ${sanitizeInput(d.libelle.trim())}${d.detail.trim() ? ' — ' + sanitizeInput(d.detail.trim()) : ''}`)
      .join('\n');
    const directivesTexte = [directivesAlimTexte, directivesVieTexte].filter(t => t).join('\n');

    const rapport: Rapport = {
      patient: { id: this.selectedPatient.id },
      soignant: { id: 1 },
      typeRapport: 'HEBDOMADAIRE',
      periodeDebut: this.dateDebut,
      periodeFin: this.dateFin,
      titre: sanitizeInput(`Rapport de suivi — ${this.selectedPatient.name} (${this.dateDebut} à ${this.dateFin})`),
      contenuTexte: sanitizeInput(contenuTraitements),
      directives: directivesTexte ? sanitizeInput(directivesTexte) : undefined,
      recommandations: sanitizeInput(this.attentesGenerales.trim()) || undefined,
      statut: 'GENERE'
    };

    this.submitting = true;
    this.rapportService.create(rapport).subscribe({
      next: () => {
        this.creerTraitementsDepuisRapport(traitementsValides);
      },
      error: (err) => {
        this.submitting = false;
        console.error('Erreur création rapport:', err);
        // Handle backend validation errors (400)
        if (err.status === 400 && err.error && typeof err.error === 'object') {
          this.formErrors = err.error;
          this.errorMessage = Object.values(err.error)[0] as string || this.translate.instant('DOCTOR_REPORT_CREATE.SAVE_ERROR');
        } else {
          this.errorMessage = this.translate.instant('DOCTOR_REPORT_CREATE.SAVE_ERROR');
        }
      }
    });
    } catch (e: any) {
      this.submitting = false;
      console.error('Erreur submit doctor-report-create:', e);
      this.errorMessage = (e && e.message) ? String(e.message) : 'Erreur inattendue lors de la soumission.';
    }
  }

  /**
   * Crée les Traitement en BDD à partir des traitements prescrits dans le rapport.
   * Regroupe par nom+dosage pour que chaque médicament ait un seul Traitement
   * avec les bons moments (momentMatin, momentSoir, etc.).
   * Puis lance la génération de l'agenda pour la période.
   */
  private creerTraitementsDepuisRapport(
    traitementsValides: Array<{ nom: string; dosage: string; momentPrise: string }>
  ): void {
    if (!this.selectedPatient) { this.submitting = false; return; }

    // Regrouper par nom+dosage → fusionner les moments
    const grouped = new Map<string, { nom: string; dosage: string; matin: boolean; midi: boolean; soir: boolean; coucher: boolean }>();
    for (const t of traitementsValides) {
      const key = `${t.nom.toLowerCase()}|${t.dosage.toLowerCase()}`;
      if (!grouped.has(key)) {
        grouped.set(key, { nom: t.nom, dosage: t.dosage, matin: false, midi: false, soir: false, coucher: false });
      }
      const g = grouped.get(key)!;
      if (t.momentPrise === 'matin')  g.matin = true;
      if (t.momentPrise === 'midi')   g.midi = true;
      if (t.momentPrise === 'soir')   g.soir = true;
      if (t.momentPrise === 'coucher') g.coucher = true;
    }

    // Construire les payloads
    const payloads: TraitementPayload[] = Array.from(grouped.values()).map(g => ({
      patient: { id: this.selectedPatient!.id },
      nomMedicament: g.nom,
      dosage: g.dosage,
      frequence: 'Quotidien',
      momentMatin: g.matin,
      momentMidi: g.midi,
      momentSoir: g.soir,
      momentCoucher: g.coucher,
      dateDebut: this.dateDebut,
      dateFin: this.dateFin,
      actif: true
    }));

    if (payloads.length === 0) {
      this.genererAgendaEtRediriger();
      return;
    }

    // Créer tous les traitements en parallèle
    const calls = payloads.map(p => this.traitementApi.create(p));
    forkJoin(calls).subscribe({
      next: () => {
        console.log(`${payloads.length} traitement(s) créé(s) en BDD`);
        // Générer l'agenda pour la période du rapport
        this.genererAgendaEtRediriger();
      },
      error: (err) => {
        console.error('Erreur création traitements:', err);
        // Le rapport a été sauvé, on redirige quand même
        this.genererAgendaEtRediriger();
      }
    });
  }

  /** Appelle POST /api/agenda/generer pour la période du rapport, puis redirige. */
  private genererAgendaEtRediriger(): void {
    this.agendaApi.generer(this.dateDebut, this.dateFin).subscribe({
      next: (events) => {
        console.log(`${events.length} événement(s) agenda généré(s)`);
        this.submitting = false;
        this.router.navigate(['/doctor-reports']);
      },
      error: () => {
        this.submitting = false;
        this.router.navigate(['/doctor-reports']);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/doctor-reports']);
  }

  logout(): void {
    import('../keycloak').then(m => m.default.logout({ redirectUri: window.location.origin }));
  }
}
