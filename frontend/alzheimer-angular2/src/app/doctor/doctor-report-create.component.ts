import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RapportSuiviService } from '../services/rapport-suivi.service';
import {
  RapportSuiviStructure,
  TraitementPrescrit,
  DirectiveRapport,
  MomentPrise
} from '../models/rapport-suivi-structure.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';

interface PatientOption {
  id: string;
  name: string;
  age: number;
}

@Component({
  selector: 'app-doctor-report-create',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './doctor-report-create.component.html',
  styleUrls: ['./doctor-report-create.component.css']
})
export class DoctorReportCreateComponent {
  patients: PatientOption[] = [
    { id: 'p1', name: 'Alice Robert', age: 82 },
    { id: 'p2', name: 'Jean Dupont', age: 75 },
    { id: 'p3', name: 'Lucie Bernard', age: 88 },
    { id: '1', name: 'Marie Dupont', age: 78 },
    { id: '2', name: 'Jean Martin', age: 82 }
  ];

  selectedPatient: PatientOption | null = null;
  medecinNom = 'Dr. Marc Lefebvre';

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
  /** Bloc à mettre en évidence en cas d'erreur de validation (scroll + style) */
  errorBlockId: 'identity' | 'observance' | null = null;

  constructor(
    private router: Router,
    private rapportSuiviService: RapportSuiviService,
    private translate: TranslateService,
    private authService: AuthService
  ) {
    const today = new Date();
    this.dateDebut = this.formatDateForInput(today);
    const fin = new Date(today);
    fin.setDate(fin.getDate() + 6);
    this.dateFin = this.formatDateForInput(fin);
    const profile = this.authService.getCurrentUser();
    const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
    if (fullName) {
      this.medecinNom = `Dr. ${fullName}`;
    }
    this.traitements[0].attentesSuivi = this.translate.instant('DOCTOR_REPORT_CREATE.DEFAULT_MONITORING_EXPECTATION');
    this.attentesGenerales = this.translate.instant('DOCTOR_REPORT_CREATE.DEFAULT_GENERAL_EXPECTATION');
  }

  private formatDateForInput(d: Date): string {
    return d.toISOString().slice(0, 10);
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

  submit(): void {
    this.errorMessage = '';
    this.errorBlockId = null;
    if (!this.selectedPatient) {
      this.errorMessage = this.translate.instant('DOCTOR_REPORT_CREATE.SELECT_PATIENT_ERROR');
      this.errorBlockId = 'identity';
      this.scrollToBlock('block-identity');
      return;
    }
    const traitementsValides = this.traitements
      .filter(t => t.nom?.trim())
      .map((t, i) => ({
        id: t.id || 't' + (i + 1),
        nom: t.nom!.trim(),
        dosage: (t.dosage || '').trim(),
        momentPrise: t.momentPrise || 'matin',
        detail: (t as TraitementPrescrit).detail?.trim(),
        attentesSuivi: (t.attentesSuivi || '').trim() || this.translate.instant('DOCTOR_REPORT_CREATE.DEFAULT_MONITORING_EXPECTATION')
      }));
    if (traitementsValides.length === 0) {
      this.errorMessage = this.translate.instant('DOCTOR_REPORT_CREATE.TREATMENT_REQUIRED_ERROR');
      this.errorBlockId = 'observance';
      this.scrollToBlock('block-observance');
      return;
    }
    if (!this.signatureValide) {
      this.errorMessage = this.translate.instant('DOCTOR_REPORT_CREATE.VALIDATION_CHECKBOX_ERROR');
      this.scrollToBlock('block-validation');
      return;
    }
    const dateDeb = new Date(this.dateDebut);
    const dateFinR = new Date(this.dateFin);
    if (dateFinR < dateDeb) {
      this.errorMessage = this.translate.instant('DOCTOR_REPORT_CREATE.DATE_END_ERROR');
      this.scrollToBlock('block-period');
      return;
    }

    const now = new Date();
    const [nomFamille, ...prenoms] = this.selectedPatient.name.split(' ');
    const rapport: Omit<RapportSuiviStructure, 'id' | 'reponsesSoignant' | 'luParSoignant'> = {
      patientId: this.selectedPatient.id,
      patientNom: nomFamille || this.selectedPatient.name,
      patientPrenom: prenoms.join(' ') || undefined,
      patientAge: this.selectedPatient.age,
      dateCreation: now,
      medecinNom: this.medecinNom,
      dateDebut: dateDeb,
      dateFin: dateFinR,
      observanceMedicamenteuse: {
        traitements: traitementsValides,
        attentesGenerales: this.attentesGenerales.trim() || this.translate.instant('DOCTOR_REPORT_CREATE.DEFAULT_GENERAL_EXPECTATION')
      },
      alimentationHydratation: {
        directives: this.directivesAlim
          .filter(d => d.libelle.trim())
          .map((d, i) => ({
            id: d.id,
            libelle: d.libelle.trim(),
            detail: d.detail.trim() || undefined,
            type: 'alimentation_hydratation' as const
          }))
      },
      vieSocialeHygiene: {
        directives: this.directivesVieSociale
          .filter(d => d.libelle.trim())
          .map((d, i) => ({
            id: d.id,
            libelle: d.libelle.trim(),
            detail: d.detail.trim() || undefined,
            type: 'vie_sociale_hygiene' as const
          }))
      },
      signatureValidation: {
        medecinNom: this.medecinNom,
        dateValidation: now,
        valide: this.signatureValide
      }
    };

    this.submitting = true;
    this.rapportSuiviService.creerRapportSuivi(rapport).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/doctor-reports']);
      },
      error: () => {
        this.submitting = false;
        this.errorMessage = this.translate.instant('DOCTOR_REPORT_CREATE.SAVE_ERROR');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/doctor-reports']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
