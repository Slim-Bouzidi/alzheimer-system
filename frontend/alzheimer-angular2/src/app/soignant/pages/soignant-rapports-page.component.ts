import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { SoignantService } from '../soignant.service';
import { RapportSuiviService } from '../../services/rapport-suivi.service';
import { RapportMedical } from '../../models/rapport-medical.model';
import {
  RapportSuiviStructure,
  toutesDirectivesRapport,
  syntheseReponsesRapport,
  StatutDirectiveSuivi
} from '../../models/rapport-suivi-structure.model';

@Component({
  selector: 'app-soignant-rapports-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './soignant-rapports-page.component.html',
  styleUrls: ['../soignant-pages.css']
})
export class SoignantRapportsPageComponent implements OnInit {
  rapports: RapportMedical[] = [];
  selectedRapport: RapportMedical | null = null;

  rapportsSuivi: RapportSuiviStructure[] = [];
  selectedRapportSuivi: RapportSuiviStructure | null = null;

  constructor(
    private soignantService: SoignantService,
    private rapportSuiviService: RapportSuiviService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refreshRapports();
    this.refreshRapportsSuivi();
  }

  refreshRapports(): void {
    this.rapports = this.soignantService.getRapportsMedicauxRecus();
  }

  refreshRapportsSuivi(): void {
    this.rapportsSuivi = this.rapportSuiviService.getRapportsSuiviStructure();
  }

  openRapport(r: RapportMedical): void {
    this.selectedRapport = r;
    this.selectedRapportSuivi = null;
  }

  openRapportSuivi(r: RapportSuiviStructure): void {
    this.selectedRapportSuivi = r;
    this.selectedRapport = null;
    if (!r.luParSoignant) {
      this.rapportSuiviService.marquerLu(r.id).subscribe(() => this.refreshRapportsSuivi());
    }
  }

  closeRapport(): void {
    this.selectedRapport = null;
    this.selectedRapportSuivi = null;
  }

  marquerLu(id: string): void {
    this.soignantService.marquerRapportLu(id).subscribe(() => {
      this.refreshRapports();
      if (this.selectedRapport && this.selectedRapport.id === id) {
        this.selectedRapport.lu = true;
      }
    });
  }

  getDirectivesForRapportSuivi(r: RapportSuiviStructure): Array<{ id: string; libelle: string; detail?: string; type: string }> {
    return toutesDirectivesRapport(r);
  }

  getReponseForDirective(r: RapportSuiviStructure, directiveId: string): { statut: StatutDirectiveSuivi; commentaireSoignant: string } {
    const rep = r.reponsesSoignant.find(x => x.directiveId === directiveId);
    return rep
      ? { statut: rep.statut, commentaireSoignant: rep.commentaireSoignant || '' }
      : { statut: 'en_cours', commentaireSoignant: '' };
  }

  getSynthese(r: RapportSuiviStructure): { fait: number; en_cours: number; non_fait: number; total: number } {
    return syntheseReponsesRapport(r);
  }

  updateDirectiveStatut(rapportId: string, directiveId: string, statut: StatutDirectiveSuivi, commentaire: string): void {
    this.rapportSuiviService.mettreAJourReponseDirective(rapportId, directiveId, statut, commentaire).subscribe(() => {
      this.refreshRapportsSuivi();
      const r = this.rapportSuiviService.getRapportById(rapportId);
      if (r && this.selectedRapportSuivi?.id === rapportId) {
        this.selectedRapportSuivi = r;
      }
    });
  }

  logout(): void {
    this.router.navigate(['/test']);
  }
}
