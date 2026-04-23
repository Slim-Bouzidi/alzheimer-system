import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FicheTransmission } from '../../models/fiche-transmission.model';
import { RapportSuiviService } from '../../services/rapport-suivi.service';
import { toutesDirectivesRapport } from '../../models/rapport-suivi-structure.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-soignant-suivi-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './soignant-suivi-page.component.html',
  styleUrls: ['../soignant-pages.css']
})
export class SoignantSuiviPageComponent implements OnInit {
  fiche: FicheTransmission = {
    id: '',
    patientId: 'p1',
    soignantId: 'S001',
    dateCreation: new Date(),
    statut: 'brouillon',
    patientInfo: {
      nom: 'Robert',
      prenom: 'Alice',
      age: 82,
      dateDuJour: new Date(),
      heureSaisie: new Date()
    },
    soignantInfo: {
      nom: 'Dubois',
      prenom: 'Sophie',
      role: 'Aide-Soignante'
    },
    observanceMedicaments: {
      listeMedicaments: [
        { nom: 'Donepezil', dosage: '10mg', moment: 'matin', pris: false },
        { nom: 'Memantine', dosage: '5mg', moment: 'midi', pris: false },
        { nom: 'Kardegic', dosage: '75mg', moment: 'midi', pris: false },
        { nom: 'Seresta', dosage: '10mg', moment: 'soir', pris: false }
      ],
      totalPris: 0,
      totalPrevus: 4
    },
    alimentation: {
      appetit: 'bon',
      hydratation: 'suffisante',
      repasPris: 3,
      repasPrevus: 3,
      details: ''
    },
    vieSociale: {
      activitesRealisees: ['Promenade', 'Lecture'],
      interaction: 'normale',
      hygiene: 'autonome',
      sommeil: 'calme'
    },
    suiviDirectives: [
      { directiveId: 'D1', reponse: '', statut: 'en_cours' },
      { directiveId: 'D2', reponse: '', statut: 'en_cours' }
    ],
    signatureSoignant: false,
    commentaireLibre: ''
  };

  /** Directives issues du dernier rapport de suivi (médecin) ou valeurs par défaut */
  mockDirectives: { id: string; libelle: string }[] = [];
  rapportSuiviLibelle = ''; // ex. "Rapport du 12/02/2025 — Dr. Marc Lefebvre"

  submissionSuccess = false;

  constructor(
    private router: Router,
    private rapportSuiviService: RapportSuiviService,
    private translate: TranslateService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.mockDirectives = [
      { id: 'D1', libelle: this.translate.instant('SOIGNANT.DIRECTIVE_HYDRATION') },
      { id: 'D2', libelle: this.translate.instant('SOIGNANT.DIRECTIVE_BLOOD_PRESSURE') }
    ];
    this.fiche.soignantInfo.role = this.translate.instant('SOIGNANT.ROLE_AIDE_SOIGNANTE');
    this.fiche.dateCreation = new Date();
    this.fiche.patientInfo.dateDuJour = new Date();
    this.fiche.patientInfo.heureSaisie = new Date();
    this.updateMedicationCounts();
    this.chargerDirectivesDepuisRapportSuivi();
  }

  /** Intégration rapport hebdomadaire : charger les directives du rapport couvrant la date du jour */
  chargerDirectivesDepuisRapportSuivi(): void {
    const dateDuJour = this.fiche.patientInfo.dateDuJour;
    const dateStr = dateDuJour instanceof Date ? dateDuJour.toISOString().slice(0, 10) : String(dateDuJour).slice(0, 10);
    const rapport = this.rapportSuiviService.getRapportPourPatientEtDate(this.fiche.patientId, dateStr)
      ?? this.rapportSuiviService.getDernierRapportPourPatient(this.fiche.patientId);
    if (rapport) {
      const dirs = toutesDirectivesRapport(rapport);
      this.mockDirectives = dirs.map(d => ({ id: d.id, libelle: d.libelle }));
      this.fiche.suiviDirectives = rapport.reponsesSoignant.map(r => ({
        directiveId: r.directiveId,
        reponse: r.commentaireSoignant || '',
        statut: r.statut
      }));
      const deb = rapport.dateDebut ? (rapport.dateDebut instanceof Date ? rapport.dateDebut : new Date(rapport.dateDebut)) : null;
      const fin = rapport.dateFin ? (rapport.dateFin instanceof Date ? rapport.dateFin : new Date(rapport.dateFin)) : null;
      if (deb && fin) {
        this.rapportSuiviLibelle = this.translate.instant('SOIGNANT.WEEKLY_REPORT_LABEL', { start: deb.toLocaleDateString('fr-FR'), end: fin.toLocaleDateString('fr-FR'), doctor: rapport.medecinNom });
      } else {
        this.rapportSuiviLibelle = this.translate.instant('SOIGNANT.REPORT_LABEL', { date: new Date(rapport.dateCreation).toLocaleDateString('fr-FR'), doctor: rapport.medecinNom });
      }
    }
  }

  getDirectiveLabel(id: string): string {
    return this.mockDirectives.find(d => d.id === id)?.libelle || this.translate.instant('SOIGNANT.UNKNOWN_DIRECTIVE');
  }

  updateMedicationCounts(): void {
    const meds = this.fiche.observanceMedicaments.listeMedicaments;
    this.fiche.observanceMedicaments.totalPris = meds.filter(m => m.pris).length;
    this.fiche.observanceMedicaments.totalPrevus = meds.length;
  }

  toggleMedication(index: number): void {
    this.fiche.observanceMedicaments.listeMedicaments[index].pris = !this.fiche.observanceMedicaments.listeMedicaments[index].pris;
    this.updateMedicationCounts();
  }

  submitFiche(): void {
    if (this.fiche.signatureSoignant) {
      this.fiche.statut = 'envoye';
      this.fiche.dateEnvoi = new Date();
      this.submissionSuccess = true;
      // Ici, on appellerait le service pour sauvegarder

      setTimeout(() => {
        this.router.navigate(['/soignant-dashboard']);
      }, 2000);
    } else {
      alert(this.translate.instant('FICHE_TRANSMISSION.SIGN_BEFORE_SUBMIT'));
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
