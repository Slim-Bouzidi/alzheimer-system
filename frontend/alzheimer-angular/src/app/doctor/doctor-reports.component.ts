import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, interval, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { RapportService, Rapport } from '../services/rapport.service';
import { PatientService, Patient } from '../services/patient.service';
import { RapportSuiviService } from '../services/rapport-suivi.service';
import { RapportSuiviStructure } from '../models/rapport-suivi-structure.model';
import { NotificationApiService, NotificationApi } from '../services/notification-api.service';
import { RapportHebdomadaireApiService } from '../services/rapport-hebdomadaire-api.service';
import { FicheTransmissionApiService } from '../services/fiche-transmission-api.service';
import { DoctorNotificationWsService, DoctorNotificationMessage } from '../services/doctor-notification-ws.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';
import keycloak from '../keycloak';

@Component({
    selector: 'app-doctor-reports',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TranslateModule],
    templateUrl: './doctor-reports.component.html',
    styleUrls: ['./doctor-reports.component.css']
})
export class DoctorReportsComponent implements OnInit, OnDestroy {

    userName = keycloak.tokenParsed?.['name'] || keycloak.tokenParsed?.['preferred_username'] || 'Médecin';

    // Data from API
    rapports: Rapport[] = [];
    patients: Patient[] = [];
    rapportsSuivi: RapportSuiviStructure[] = [];
    rapportsHebdo: any[] = [];
    selectedHebdo: any | null = null;
    fichesRecues: any[] = [];
    selectedFicheRecue: any | null = null;

    // Pagination for Fiches de Transmission
    fichesPagination = {
        currentPage: 1,
        pageSize: 5,
        pageSizeOptions: [5, 10, 20],
        get totalPages(): number {
            return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
        },
        totalItems: 0
    };
    pagedFiches: any[] = [];

    // Pagination for Medical Reports (rapports)
    rapportsPagination = {
        currentPage: 1,
        pageSize: 5,
        pageSizeOptions: [5, 10, 20],
        get totalPages(): number {
            return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
        },
        totalItems: 0
    };
    pagedRapports: Rapport[] = [];

    // Notifications
    notifications: NotificationApi[] = [];
    unreadCount = 0;
    showNotifPanel = false;
    private notifPoll$?: Subscription;
    private notifWs$?: Subscription;
    readonly DOCTOR_USER_ID = 1; // TODO: get from auth

    // Search & filter
    searchQuery: string = '';
    activeFilter: string = 'all';
    filteredRapports: Rapport[] = [];

    // Loading states
    loading: boolean = true;

    // Consultation modal
    selectedRapport: Rapport | null = null;

    // Modification modal
    editRapport: Rapport | null = null;
    editSaving: boolean = false;

    constructor(
        private router: Router,
        private rapportService: RapportService,
        private patientService: PatientService,
        private rapportSuiviService: RapportSuiviService,
        private notificationService: NotificationApiService,
        private rapportHebdoApi: RapportHebdomadaireApiService,
        private ficheApi: FicheTransmissionApiService,
        private doctorWs: DoctorNotificationWsService,
        private http: HttpClient,
        private translate: TranslateService
    ) { }

    ngOnInit(): void {
        this.loadData();
        this.rapportsSuivi = this.rapportSuiviService.getRapportsSuiviStructure();
        this.loadNotifications();
        this.loadRapportsHebdo();
        this.loadFichesRecues();
        // Poll for new notifications every 30s
        this.notifPoll$ = interval(30000).subscribe(() => this.loadNotifications());

        // Realtime notifications (WebSocket)
        this.doctorWs.connect();
        this.notifWs$ = this.doctorWs.notifications$.subscribe((msg: DoctorNotificationMessage) => {
            // If a different doctor is logged-in, you can filter by destinataireId later
            const incoming: NotificationApi = {
                id: msg.notificationId,
                type: msg.type,
                titre: msg.titre,
                message: msg.message,
                lu: false,
                referenceType: msg.referenceType,
                referenceId: msg.referenceId,
                dateCreation: msg.dateCreation
            };
            this.notifications = [incoming, ...this.notifications];
            this.unreadCount = this.unreadCount + 1;
        });
    }

    ngOnDestroy(): void {
        this.notifPoll$?.unsubscribe();
        this.notifWs$?.unsubscribe();
        this.doctorWs.disconnect();
    }

    // === Notifications ===
    loadNotifications(): void {
        this.notificationService.getByUser(this.DOCTOR_USER_ID).subscribe({
            next: (data) => this.notifications = data,
            error: () => {}
        });
        this.notificationService.getUnreadCount(this.DOCTOR_USER_ID).subscribe({
            next: (res) => this.unreadCount = res.count,
            error: () => {}
        });
    }

    toggleNotifPanel(): void {
        this.showNotifPanel = !this.showNotifPanel;
    }

    markNotifRead(notif: NotificationApi): void {
        if (notif.lu || !notif.id) return;
        this.notificationService.marquerLu(notif.id).subscribe({
            next: () => {
                notif.lu = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
            },
            error: () => {}
        });
    }

    markAllRead(): void {
        this.notificationService.marquerToutLu(this.DOCTOR_USER_ID).subscribe({
            next: () => {
                this.notifications.forEach(n => n.lu = true);
                this.unreadCount = 0;
            },
            error: () => {}
        });
    }

    /** Download fiche PDF from notification reference */
    downloadFichePdfFromNotif(notif: NotificationApi): void {
        this.markNotifRead(notif);
        if (notif.referenceType === 'FICHE_TRANSMISSION' && notif.referenceId) {
            this.downloadFichePdf(notif.referenceId);
        }
    }

    downloadFichePdf(ficheId: number): void {
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

    /** Open hebdo report from notification */
    openHebdoFromNotif(notif: NotificationApi): void {
        this.markNotifRead(notif);
        if (notif.referenceType === 'RAPPORT_HEBDOMADAIRE' && notif.referenceId) {
            const rapport = this.rapportsHebdo.find((r: any) => r.id === notif.referenceId);
            if (rapport) {
                this.consulterHebdo(rapport);
            } else {
                // Reload and retry
                this.rapportHebdoApi.getAll().subscribe({
                    next: (data: any[]) => {
                        this.rapportsHebdo = data.filter((r: any) => r.envoyeAuMedecin === true)
                            .sort((a: any, b: any) => new Date(b.dateEnvoi).getTime() - new Date(a.dateEnvoi).getTime());
                        const found = this.rapportsHebdo.find((r: any) => r.id === notif.referenceId);
                        if (found) this.consulterHebdo(found);
                    }
                });
            }
        }
    }

    loadData(): void {
        this.loading = true;

        // Charger patients et rapports en parallèle
        forkJoin({
            patients: this.patientService.getAll(),
            rapports: this.rapportService.getAll()
        }).subscribe({
            next: ({ patients, rapports }) => {
                this.patients = patients;
                this.rapports = rapports;
                this.filterRapports();
                this.loading = false;
            },
            error: (err) => {
                console.error('Erreur chargement données:', err);
                this.loading = false;
            }
        });
    }

    // === Stats dynamiques ===
    get totalRapports(): number {
        return this.rapports.length;
    }

    get patientsActifs(): number {
        return this.patients.filter(p => p.actif !== false).length;
    }

    get rapportsEnvoyes(): number {
        return this.rapports.filter(r => r.statut === 'ENVOYE').length;
    }

    get rapportsGeneres(): number {
        return this.rapports.filter(r => r.statut === 'GENERE').length;
    }

    get moyenneObservance(): number {
        const withObs = this.rapports.filter(r => r.tauxObservance != null && r.tauxObservance > 0);
        if (withObs.length === 0) return 0;
        const sum = withObs.reduce((acc, r) => acc + (r.tauxObservance || 0), 0);
        return Math.round(sum / withObs.length);
    }

    // === Search & Filter ===
    filterRapports(): void {
        let result = [...this.rapports];

        // Filtre par statut
        if (this.activeFilter !== 'all') {
            result = result.filter(r => r.statut === this.activeFilter);
        }

        // Filtre par recherche
        const q = this.searchQuery.toLowerCase().trim();
        if (q) {
            result = result.filter(r =>
                (r.titre || '').toLowerCase().includes(q) ||
                (r.typeRapport || '').toLowerCase().includes(q) ||
                (r.patient?.nomComplet || '').toLowerCase().includes(q)
            );
        }

        this.filteredRapports = result;
        this.rapportsPagination.totalItems = result.length;
        this.rapportsPagination.currentPage = 1;
        this.applyRapportsPagination();
    }

    setFilter(filter: string): void {
        this.activeFilter = filter;
        this.filterRapports();
    }

    // === Actions ===
    deleteRapport(id: number): void {
        if (!confirm(this.translate.instant('DOCTOR_REPORTS.CONFIRM_DELETE'))) return;
        this.rapportService.delete(id).subscribe({
            next: () => {
                this.rapports = this.rapports.filter(r => r.id !== id);
                this.filterRapports();
            },
            error: (err) => console.error('Erreur suppression:', err)
        });
    }

    envoyerRapport(rapport: Rapport): void {
        if (!rapport.id) return;
        this.rapportService.envoyer(rapport.id).subscribe({
            next: (updated) => {
                const idx = this.rapports.findIndex(r => r.id === updated.id);
                if (idx >= 0) this.rapports[idx] = updated;
                this.filterRapports();
            },
            error: (err) => {
                console.error('Erreur envoi:', err);
                // Fallback local
                rapport.statut = 'ENVOYE';
                this.filterRapports();
            }
        });
    }

    getStatutLabel(statut: string | undefined): string {
        switch (statut) {
            case 'GENERE': return 'DOCTOR_REPORTS.STATUS_GENERATED';
            case 'ENVOYE': return 'DOCTOR_REPORTS.STATUS_SENT';
            case 'ARCHIVE': return 'DOCTOR_REPORTS.STATUS_ARCHIVED';
            default: return statut || '—';
        }
    }

    getTypeLabel(type: string | undefined): string {
        switch (type) {
            case 'QUOTIDIEN': return 'DOCTOR_REPORTS.TYPE_DAILY';
            case 'HEBDOMADAIRE': return 'DOCTOR_REPORTS.TYPE_WEEKLY';
            case 'MENSUEL': return 'DOCTOR_REPORTS.TYPE_MONTHLY';
            case 'INCIDENT': return 'DOCTOR_REPORTS.TYPE_INCIDENT';
            default: return type || '—';
        }
    }

    logout(): void {
        import('../keycloak').then(m => m.default.logout({ redirectUri: window.location.origin }));
    }

    downloadReport(id: number): void {
        this.rapportService.getById(id).subscribe({
            next: (rapport) => {
                if (rapport.cheminFichier) {
                    window.open(rapport.cheminFichier, '_blank');
                } else {
                    this.generateAndDownload(rapport);
                }
            },
            error: () => alert('Erreur lors du téléchargement du rapport.')
        });
    }

    /** Génère un document médical structuré au format académique Alzheimer et le télécharge en HTML */
    private generateAndDownload(rapport: Rapport): void {
        const patient = rapport.patient?.nomComplet || 'Patient inconnu';
        const auteur = rapport.soignant?.nomComplet || rapport.soignant?.nom || 'Médecin';
        const dateGen = rapport.dateGeneration ? new Date(rapport.dateGeneration).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR');
        const periodeStr = (rapport.periodeDebut && rapport.periodeFin)
            ? `${new Date(rapport.periodeDebut).toLocaleDateString('fr-FR')} → ${new Date(rapport.periodeFin).toLocaleDateString('fr-FR')}`
            : '—';

        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport Médical #${rapport.id} — ${patient}</title>
<style>
  @page { size: A4; margin: 20mm 18mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', 'Georgia', serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; background: #fff; }
  .page { max-width: 210mm; margin: 0 auto; padding: 20mm 18mm; }

  /* Header */
  .doc-header { border-bottom: 3px double #1a3a5c; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
  .doc-header-left { }
  .doc-institution { display: block; font-size: 14pt; font-weight: bold; color: #1a3a5c; letter-spacing: 0.5px; }
  .doc-subtitle { display: block; font-size: 9pt; color: #555; margin-top: 2px; }
  .doc-header-right { text-align: right; font-size: 9pt; color: #444; }
  .doc-ref { display: block; font-weight: bold; font-size: 10pt; }

  /* Title */
  .doc-title { text-align: center; margin: 16px 0 20px; }
  .doc-title h1 { font-size: 15pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #1a3a5c; border-bottom: 1px solid #ccc; padding-bottom: 6px; display: inline-block; }

  /* Section */
  .section { margin-bottom: 18px; page-break-inside: avoid; }
  .section-title { font-size: 11pt; font-weight: bold; color: #1a3a5c; border-bottom: 1px solid #d0d0d0; padding-bottom: 3px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .section-letter { display: inline-block; width: 22px; height: 22px; background: #1a3a5c; color: white; text-align: center; line-height: 22px; border-radius: 3px; font-size: 9pt; font-weight: bold; margin-right: 8px; vertical-align: middle; }

  /* Summary table */
  .summary-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 10px; }
  .summary-table td { padding: 4px 8px; border: 1px solid #ddd; }
  .summary-table .label { background: #f5f7fa; font-weight: 600; color: #333; width: 35%; }

  /* Indicators */
  .indicators-row { display: flex; gap: 12px; margin: 8px 0 10px; }
  .indicator-box { flex: 1; text-align: center; border: 1px solid #d0d0d0; border-radius: 4px; padding: 8px 4px; }
  .indicator-val { display: block; font-size: 16pt; font-weight: bold; color: #1a3a5c; }
  .indicator-val.alert { color: #c0392b; }
  .indicator-lbl { display: block; font-size: 8pt; color: #666; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.3px; }

  /* Clinical notes */
  .clinical-block { background: #fafbfc; border: 1px solid #e0e0e0; border-left: 3px solid #1a3a5c; padding: 10px 14px; margin: 6px 0; font-family: 'Courier New', monospace; font-size: 10pt; white-space: pre-wrap; word-break: break-word; line-height: 1.6; }
  .clinical-block.directive { border-left-color: #2980b9; }
  .clinical-block.reco { border-left-color: #27ae60; }

  /* Caregiver section */
  .caregiver-section { border: 2px solid #e67e22; border-radius: 6px; padding: 12px 16px; margin: 16px 0; background: #fef9f2; }
  .caregiver-section h3 { color: #e67e22; font-size: 11pt; margin-bottom: 8px; }
  .caregiver-notice { font-size: 9pt; color: #888; font-style: italic; margin-bottom: 8px; }
  .caregiver-block { margin-bottom: 10px; }
  .caregiver-block h4 { font-size: 10pt; font-weight: bold; color: #d35400; margin-bottom: 4px; }
  .caregiver-text { font-size: 10pt; white-space: pre-wrap; line-height: 1.5; }

  /* Footer */
  .doc-footer { margin-top: 24px; border-top: 2px solid #1a3a5c; padding-top: 10px; font-size: 8.5pt; color: #666; }
  .doc-footer-grid { display: flex; justify-content: space-between; }
  .doc-footer-col { }
  .footer-label { font-weight: bold; color: #444; }
  .confidential { text-align: center; margin-top: 10px; font-size: 8pt; color: #999; text-transform: uppercase; letter-spacing: 1px; }
</style>
</head>
<body>
<div class="page">
  <!-- HEADER -->
  <div class="doc-header">
    <div class="doc-header-left">
      <span class="doc-institution">AXE Alzheimer e-Health</span>
      <span class="doc-subtitle">Plateforme de suivi clinique — Maladie d'Alzheimer et troubles neurocognitifs</span>
    </div>
    <div class="doc-header-right">
      <span class="doc-ref">Réf. RAP-${String(rapport.id).padStart(5, '0')}</span>
      <span>${dateGen}</span>
    </div>
  </div>

  <!-- TITLE -->
  <div class="doc-title">
    <h1>${rapport.titre || 'Rapport de suivi clinique'}</h1>
  </div>

  <!-- A. EXECUTIVE SUMMARY -->
  <div class="section">
    <div class="section-title"><span class="section-letter">A</span> Synthèse clinique</div>
    <table class="summary-table">
      <tr><td class="label">Patient</td><td>${patient}</td></tr>
      <tr><td class="label">Période de suivi</td><td>${periodeStr}</td></tr>
      <tr><td class="label">Type de rapport</td><td>${rapport.typeRapport || '—'}</td></tr>
      <tr><td class="label">Statut du document</td><td>${rapport.statut || '—'}</td></tr>
      <tr><td class="label">Médecin rédacteur</td><td>${auteur}</td></tr>
      <tr><td class="label">Date de génération</td><td>${dateGen}</td></tr>
    </table>
  </div>

  <!-- B. CLINICAL INDICATORS -->
  ${this.hasIndicators(rapport) ? `
  <div class="section">
    <div class="section-title"><span class="section-letter">B</span> Indicateurs cliniques</div>
    <div class="indicators-row">
      ${rapport.tauxObservance != null ? `<div class="indicator-box"><span class="indicator-val${rapport.tauxObservance < 70 ? ' alert' : ''}">${rapport.tauxObservance}%</span><span class="indicator-lbl">Observance</span></div>` : ''}
      ${rapport.qualiteSommeil != null ? `<div class="indicator-box"><span class="indicator-val${rapport.qualiteSommeil < 5 ? ' alert' : ''}">${rapport.qualiteSommeil}/10</span><span class="indicator-lbl">Sommeil</span></div>` : ''}
      ${rapport.nbAlertes != null ? `<div class="indicator-box"><span class="indicator-val${rapport.nbAlertes > 0 ? ' alert' : ''}">${rapport.nbAlertes}</span><span class="indicator-lbl">Alertes</span></div>` : ''}
      ${rapport.nbInterventions != null ? `<div class="indicator-box"><span class="indicator-val">${rapport.nbInterventions}</span><span class="indicator-lbl">Interventions</span></div>` : ''}
      ${rapport.nbComportementsAnormaux != null ? `<div class="indicator-box"><span class="indicator-val${rapport.nbComportementsAnormaux > 0 ? ' alert' : ''}">${rapport.nbComportementsAnormaux}</span><span class="indicator-lbl">Comp. anormaux</span></div>` : ''}
    </div>
  </div>` : ''}

  <!-- C. THERAPEUTIC PROTOCOL -->
  ${rapport.contenuTexte ? `
  <div class="section">
    <div class="section-title"><span class="section-letter">C</span> Protocole thérapeutique — Observations du soignant</div>
    <div class="clinical-block">${this.escapeHtml(rapport.contenuTexte)}</div>
  </div>` : ''}

  <!-- D. PHYSICIAN DIRECTIVES -->
  ${rapport.directives ? `
  <div class="section">
    <div class="section-title"><span class="section-letter">D</span> Directives médicales</div>
    <div class="clinical-block directive">${this.escapeHtml(rapport.directives)}</div>
  </div>` : ''}

  <!-- E. RECOMMENDATIONS -->
  ${rapport.recommandations ? `
  <div class="section">
    <div class="section-title"><span class="section-letter">E</span> Recommandations et plan de suivi</div>
    <div class="clinical-block reco">${this.escapeHtml(rapport.recommandations)}</div>
  </div>` : ''}

  <!-- CAREGIVER SECTION -->
  ${(rapport.directives || rapport.recommandations) ? `
  <div class="caregiver-section">
    <h3>★ Section simplifiée pour l'aidant / soignant</h3>
    <p class="caregiver-notice">Cette section résume les consignes en langage simplifié pour le personnel soignant et les aidants familiaux.</p>
    ${rapport.directives ? `<div class="caregiver-block"><h4>Ce qu'il faut faire :</h4><div class="caregiver-text">${this.escapeHtml(rapport.directives)}</div></div>` : ''}
    ${rapport.recommandations ? `<div class="caregiver-block"><h4>Ce qu'il faut surveiller :</h4><div class="caregiver-text">${this.escapeHtml(rapport.recommandations)}</div></div>` : ''}
  </div>` : ''}

  <!-- FOOTER / TRACEABILITY -->
  <div class="doc-footer">
    <div class="doc-footer-grid">
      <div class="doc-footer-col">
        <span class="footer-label">Auteur :</span> ${auteur}<br>
        <span class="footer-label">Source :</span> AXE Alzheimer e-Health — Module Médecin
      </div>
      <div class="doc-footer-col">
        <span class="footer-label">Réf. :</span> RAP-${String(rapport.id).padStart(5, '0')}<br>
        <span class="footer-label">Généré le :</span> ${dateGen}
      </div>
    </div>
    <p class="confidential">Document confidentiel — Données médicales protégées — Loi n° 2002-303 relative aux droits des malades</p>
  </div>
</div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RAP-${String(rapport.id).padStart(5, '0')}_${patient.replace(/\s+/g, '_')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /** Échappe les caractères HTML */
    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    goToCreateRapportSuivi(): void {
        this.router.navigate(['/doctor-report-create']);
    }

    goToPatients(): void {
        this.router.navigate(['/doctor-patients']);
    }

    // === Rapports hebdomadaires reçus des soignants ===
    loadRapportsHebdo(): void {
        this.rapportHebdoApi.getAll().subscribe({
            next: (data) => {
                // Only show reports that have been sent by soignant
                this.rapportsHebdo = data
                    .filter((r: any) => r.envoyeAuMedecin === true)
                    .sort((a: any, b: any) =>
                        new Date(b.dateEnvoi || b.dateCreation || 0).getTime() -
                        new Date(a.dateEnvoi || a.dateCreation || 0).getTime()
                    );
            },
            error: (err) => console.error('Erreur chargement rapports hebdo:', err)
        });
    }

    /** Open weekly report and mark it as consulted */
    consulterHebdo(rapport: any): void {
        this.selectedHebdo = rapport;
        // Mark as consulted via API if not already
        if (rapport.id && !rapport.consulteParMedecin) {
            this.rapportHebdoApi.marquerConsulte(rapport.id).subscribe({
                next: (updated: any) => {
                    rapport.consulteParMedecin = true;
                    rapport.dateConsultation = updated.dateConsultation;
                },
                error: () => {}
            });
        }
    }

    fermerHebdo(): void {
        this.selectedHebdo = null;
    }

    getHebdoStatut(r: any): string {
        if (r.consulteParMedecin) return 'Consulté';
        if (r.envoyeAuMedecin) return 'Envoyé';
        return 'En attente';
    }

    // === Fiches de Transmission Reçues ===
    loadFichesRecues(): void {
        this.ficheApi.getAll().subscribe({
            next: (data: any[]) => {
                this.fichesRecues = data
                    .filter((f: any) => f.statut === 'envoye')
                    .sort((a: any, b: any) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());
                this.fichesPagination.totalItems = this.fichesRecues.length;
                this.fichesPagination.currentPage = 1;
                this.applyFichesPagination();
            },
            error: () => {}
        });
    }

    applyFichesPagination(): void {
        const startIdx = (this.fichesPagination.currentPage - 1) * this.fichesPagination.pageSize;
        const endIdx = startIdx + this.fichesPagination.pageSize;
        this.pagedFiches = this.fichesRecues.slice(startIdx, endIdx);
    }

    goToFichePage(page: number): void {
        if (page < 1 || page > this.fichesPagination.totalPages) return;
        this.fichesPagination.currentPage = page;
        this.applyFichesPagination();
    }

    nextFichePage(): void {
        if (this.fichesPagination.currentPage < this.fichesPagination.totalPages) {
            this.fichesPagination.currentPage++;
            this.applyFichesPagination();
        }
    }

    prevFichePage(): void {
        if (this.fichesPagination.currentPage > 1) {
            this.fichesPagination.currentPage--;
            this.applyFichesPagination();
        }
    }

    onFichePageSizeChange(): void {
        this.fichesPagination.currentPage = 1;
        this.applyFichesPagination();
    }

    get ficheRangeStart(): number {
        if (this.fichesPagination.totalItems === 0) return 0;
        return (this.fichesPagination.currentPage - 1) * this.fichesPagination.pageSize + 1;
    }

    get ficheRangeEnd(): number {
        return Math.min(this.fichesPagination.totalItems, this.fichesPagination.currentPage * this.fichesPagination.pageSize);
    }

    applyRapportsPagination(): void {
        const startIdx = (this.rapportsPagination.currentPage - 1) * this.rapportsPagination.pageSize;
        const endIdx = startIdx + this.rapportsPagination.pageSize;
        this.pagedRapports = this.filteredRapports.slice(startIdx, endIdx);
    }

    goToRapportPage(page: number): void {
        if (page < 1 || page > this.rapportsPagination.totalPages) return;
        this.rapportsPagination.currentPage = page;
        this.applyRapportsPagination();
    }

    nextRapportPage(): void {
        if (this.rapportsPagination.currentPage < this.rapportsPagination.totalPages) {
            this.rapportsPagination.currentPage++;
            this.applyRapportsPagination();
        }
    }

    prevRapportPage(): void {
        if (this.rapportsPagination.currentPage > 1) {
            this.rapportsPagination.currentPage--;
            this.applyRapportsPagination();
        }
    }

    onRapportPageSizeChange(): void {
        this.rapportsPagination.currentPage = 1;
        this.applyRapportsPagination();
    }

    get rapportRangeStart(): number {
        if (this.rapportsPagination.totalItems === 0) return 0;
        return (this.rapportsPagination.currentPage - 1) * this.rapportsPagination.pageSize + 1;
    }

    get rapportRangeEnd(): number {
        return Math.min(this.rapportsPagination.totalItems, this.rapportsPagination.currentPage * this.rapportsPagination.pageSize);
    }

    consulterFicheRecue(fiche: any): void {
        this.selectedFicheRecue = fiche;
    }

    fermerFicheRecue(): void {
        this.selectedFicheRecue = null;
    }

    // === Consultation (view) ===
    consulterRapport(rapport: Rapport): void {
        this.selectedRapport = rapport;
    }

    fermerConsultation(): void {
        this.selectedRapport = null;
    }

    /** Vérifie si le rapport contient au moins un indicateur clinique */
    hasIndicators(r: Rapport): boolean {
        return r.tauxObservance != null || r.qualiteSommeil != null ||
               r.nbAlertes != null || r.nbInterventions != null ||
               r.nbComportementsAnormaux != null;
    }

    // === Modification (edit) ===
    modifierRapport(rapport: Rapport): void {
        // Copie pour ne pas modifier directement l'objet en mémoire
        this.editRapport = { ...rapport };
    }

    fermerModification(): void {
        this.editRapport = null;
        this.editSaving = false;
    }

    sauvegarderModification(): void {
        if (!this.editRapport || !this.editRapport.id) return;
        this.editSaving = true;
        this.rapportService.update(this.editRapport.id, this.editRapport).subscribe({
            next: (updated) => {
                const idx = this.rapports.findIndex(r => r.id === updated.id);
                if (idx >= 0) this.rapports[idx] = updated;
                this.filterRapports();
                this.editRapport = null;
                this.editSaving = false;
            },
            error: (err) => {
                console.error('Erreur modification:', err);
                this.editSaving = false;
            }
        });
    }
}
