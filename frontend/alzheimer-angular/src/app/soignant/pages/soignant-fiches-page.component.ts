import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FicheTransmissionApiService } from '../../services/fiche-transmission-api.service';
import { PatientService, Patient } from '../../services/patient.service';
import { environment } from '../../../environments/environment';
import { FormValidator, ValidationErrors, sanitizeInput } from '../../shared/validation.utils';

@Component({
  selector: 'app-soignant-fiches-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './soignant-fiches-page.component.html',
  styleUrls: ['../soignant-pages.css', './soignant-fiches-page.component.css']
})
export class SoignantFichesPageComponent implements OnInit {

  // Data
  fiches: any[] = [];
  filteredFiches: any[] = [];
  pagedFiches: any[] = [];
  patients: Patient[] = [];
  loading = true;

  // Pagination
  pageSize = 10;
  currentPage = 1;
  readonly pageSizeOptions = [5, 10, 20, 50];

  // Filters
  searchQuery = '';
  filterStatut = 'all';
  filterPatientId: number | null = null;
  filterDateDebut = '';
  filterDateFin = '';

  // Stats
  get totalFiches(): number { return this.fiches.length; }
  get fichesEnvoyees(): number { return this.fiches.filter(f => f.statut === 'envoye').length; }
  get fichesBrouillon(): number { return this.fiches.filter(f => f.statut === 'brouillon' || !f.statut).length; }
  get fichesSignees(): number { return this.fiches.filter(f => f.signatureSoignant || f.signatureElectronique).length; }

  // Detail modal
  selectedFiche: any = null;

  // Edit modal
  editFiche: any = null;
  editSaving = false;
  formErrors: ValidationErrors = {};

  // Delete confirmation
  deleteTarget: any = null;

  // Send to Doctor
  sendTarget: any = null;
  sending = false;
  sendSuccess: any = null;
  sendError: string | null = null;

  constructor(
    private ficheApi: FicheTransmissionApiService,
    private patientService: PatientService,
    private http: HttpClient,
    private translate: TranslateService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.ficheApi.getAll().subscribe({
      next: (data) => {
        this.fiches = data.sort((a: any, b: any) =>
          new Date(b.dateCreation || b.dateFiche || 0).getTime() - new Date(a.dateCreation || a.dateFiche || 0).getTime()
        );
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement fiches:', err);
        this.loading = false;
      }
    });

    this.patientService.getAll().subscribe({
      next: (data) => this.patients = data,
      error: () => { }
    });
  }

  // ═══ FILTERING ═══
  applyFilters(): void {
    let result = [...this.fiches];

    // Statut
    if (this.filterStatut !== 'all') {
      if (this.filterStatut === 'brouillon') {
        result = result.filter(f => f.statut === 'brouillon' || !f.statut);
      } else {
        result = result.filter(f => f.statut === this.filterStatut);
      }
    }

    // Patient
    if (this.filterPatientId) {
      result = result.filter(f =>
        f.patient?.id === this.filterPatientId ||
        f.patientId === this.filterPatientId
      );
    }

    // Date range
    if (this.filterDateDebut) {
      const d = new Date(this.filterDateDebut);
      result = result.filter(f => new Date(f.dateCreation || f.dateFiche) >= d);
    }
    if (this.filterDateFin) {
      const d = new Date(this.filterDateFin);
      d.setHours(23, 59, 59);
      result = result.filter(f => new Date(f.dateCreation || f.dateFiche) <= d);
    }

    // Search
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(f => {
        // Nom du patient
        const nom = (f.patientNom || f.patient?.nom || '').toLowerCase();
        // Prénom du patient
        const prenom = (f.patientPrenom || f.patient?.prenom || '').toLowerCase();
        // Nom complet
        const nomComplet = (f.patient?.nomComplet || '').toLowerCase();
        // Commentaire
        const commentaire = (f.commentaireLibre || '').toLowerCase();
        // Numéro de fiche (ID)
        const ficheId = String(f.id || '');
        
        return nom.includes(q) || 
               prenom.includes(q) || 
               nomComplet.includes(q) ||
               commentaire.includes(q) || 
               ficheId.includes(q);
      });
    }

    this.filteredFiches = result;
    this.currentPage = 1;
    this.applyPagination();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.filterStatut = 'all';
    this.filterPatientId = null;
    this.filterDateDebut = '';
    this.filterDateFin = '';
    this.applyFilters();
  }

  // ═══ PAGINATION ═══
  get totalFiltered(): number {
    return this.filteredFiches.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
  }

  get rangeStart(): number {
    if (this.totalFiltered === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.totalFiltered, this.currentPage * this.pageSize);
  }

  applyPagination(): void {
    const safePage = Math.min(Math.max(1, this.currentPage), this.totalPages);
    this.currentPage = safePage;

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const endIdx = startIdx + this.pageSize;
    this.pagedFiches = this.filteredFiches.slice(startIdx, endIdx);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.applyPagination();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyPagination();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyPagination();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.applyPagination();
  }

  // ═══ HELPERS ═══
  getPatientName(fiche: any): string {
    if (fiche.patientPrenom || fiche.patientNom) {
      return `${fiche.patientPrenom || ''} ${fiche.patientNom || ''}`.trim();
    }
    if (fiche.patient) {
      return `${fiche.patient.prenom || ''} ${fiche.patient.nom || ''}`.trim() || fiche.patient.nomComplet || '—';
    }
    return '—';
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'envoye': return 'Envoyée';
      case 'valide': return 'Validée';
      case 'brouillon': return 'Brouillon';
      default: return 'Brouillon';
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'envoye': return 'statut-envoye';
      case 'valide': return 'statut-valide';
      default: return 'statut-brouillon';
    }
  }

  getFicheDate(fiche: any): string {
    return fiche.dateCreation || fiche.dateFiche || '';
  }

  isSigned(fiche: any): boolean {
    return fiche.signatureSoignant || fiche.signatureElectronique || false;
  }

  // ═══ PARSE JSON FIELDS ═══
  parseJson(json: string | null | undefined): any {
    if (!json) return null;
    try { return JSON.parse(json); } catch { return null; }
  }

  getMedicaments(fiche: any): any[] {
    const obs = this.parseJson(fiche.observanceMedicamentsJson);
    return obs?.listeMedicaments || obs?.medications || [];
  }

  getAlimentation(fiche: any): any {
    return this.parseJson(fiche.alimentationJson) || {};
  }

  getVieSociale(fiche: any): any {
    return this.parseJson(fiche.vieSocialeJson) || {};
  }

  getDirectives(fiche: any): any[] {
    const dir = this.parseJson(fiche.suiviDirectivesJson);
    return dir?.directives || dir || [];
  }

  // ═══ VIEW DETAIL ═══
  openDetail(fiche: any): void {
    this.selectedFiche = fiche;
    this.editFiche = null;
    this.deleteTarget = null;
  }

  closeDetail(): void {
    this.selectedFiche = null;
  }

  // ═══ EDIT ═══
  openEdit(fiche: any): void {
    this.editFiche = JSON.parse(JSON.stringify(fiche));
    this.selectedFiche = null;
    this.deleteTarget = null;
  }

  closeEdit(): void {
    this.editFiche = null;
    this.editSaving = false;
    this.formErrors = {};
  }

  saveEdit(): void {
    if (!this.editFiche?.id) return;

    const v = new FormValidator()
      .required('statut', this.editFiche.statut, 'Le statut est requis')
      .maxLength('commentaireLibre', this.editFiche.commentaireLibre, 2000, 'Maximum 2000 caractères');
    this.formErrors = v.errors;
    if (v.hasErrors()) return;

    if (this.editFiche.commentaireLibre) {
      this.editFiche.commentaireLibre = sanitizeInput(this.editFiche.commentaireLibre);
    }

    this.editSaving = true;
    this.ficheApi.update(this.editFiche.id, this.editFiche).subscribe({
      next: (updated) => {
        const idx = this.fiches.findIndex(f => f.id === updated.id);
        if (idx >= 0) this.fiches[idx] = updated;
        this.applyFilters();
        this.editFiche = null;
        this.editSaving = false;
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        this.editSaving = false;
      }
    });
  }

  // ═══ DELETE ═══
  confirmDelete(fiche: any): void {
    this.deleteTarget = fiche;
    this.selectedFiche = null;
    this.editFiche = null;
  }

  cancelDelete(): void {
    this.deleteTarget = null;
  }

  executeDelete(): void {
    if (!this.deleteTarget?.id) return;
    this.ficheApi.delete(this.deleteTarget.id).subscribe({
      next: () => {
        this.fiches = this.fiches.filter(f => f.id !== this.deleteTarget.id);
        this.applyFilters();
        this.deleteTarget = null;
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        this.deleteTarget = null;
      }
    });
  }

  // ═══ PDF DOWNLOAD ═══
  downloadPdf(ficheId: number): void {
    const url = `${environment.apiUrl}/fiches/${ficheId}/pdf`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `FT-${String(ficheId).padStart(5, '0')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      },
      error: (err) => console.error('Erreur téléchargement PDF:', err)
    });
  }

  // ═══ SEND TO DOCTOR ═══
  confirmSendToDoctor(fiche: any): void {
    // Verify fiche is signed
    if (!this.isSigned(fiche)) {
      this.sendError = 'La fiche doit être signée avant l\'envoi au médecin.';
      setTimeout(() => this.sendError = null, 4000);
      return;
    }
    // Already sent?
    if (fiche.statut === 'envoye') {
      this.sendError = 'Cette fiche a déjà été envoyée au médecin.';
      setTimeout(() => this.sendError = null, 4000);
      return;
    }
    this.sendTarget = fiche;
    this.selectedFiche = null;
  }

  cancelSend(): void {
    this.sendTarget = null;
    this.sending = false;
  }

  executeSendToDoctor(): void {
    if (!this.sendTarget?.id) return;
    this.sending = true;
    this.ficheApi.marquerEnvoye(this.sendTarget.id).subscribe({
      next: (updated) => {
        const idx = this.fiches.findIndex(f => f.id === updated.id);
        if (idx >= 0) this.fiches[idx] = updated;
        this.applyFilters();
        // Show success toast
        this.sendSuccess = {
          ficheId: updated.id,
          patientName: this.getPatientName(updated)
        };
        this.sendTarget = null;
        this.sending = false;
        // Auto-hide toast after 5s
        setTimeout(() => this.sendSuccess = null, 5000);
      },
      error: (err) => {
        console.error('Erreur envoi au médecin:', err);
        this.sendError = err.status === 400
          ? 'La fiche doit être signée et validée avant l\'envoi.'
          : 'Erreur lors de l\'envoi. Vérifiez la connexion.';
        this.sendTarget = null;
        this.sending = false;
        setTimeout(() => this.sendError = null, 5000);
      }
    });
  }

  dismissSendSuccess(): void {
    this.sendSuccess = null;
  }

  // ═══ MARK ENVOYE (kept for backward compat) ═══
  marquerEnvoye(fiche: any): void {
    this.confirmSendToDoctor(fiche);
  }

  // ═══ NAVIGATION ═══
  goToAgenda(): void {
    this.router.navigate(['/soignant-agenda']);
  }

  logout(): void {
    import('../../keycloak').then(m => m.default.logout({ redirectUri: window.location.origin }));
  }
}
