import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { RapportService, Rapport } from '../services/rapport.service';
import { PatientService, Patient } from '../services/patient.service';
import { RapportSuiviService } from '../services/rapport-suivi.service';
import { RapportSuiviStructure } from '../models/rapport-suivi-structure.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-doctor-reports',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, TranslateModule],
    templateUrl: './doctor-reports.component.html',
    styleUrls: ['./doctor-reports.component.css']
})
export class DoctorReportsComponent implements OnInit {

    // Data from API
    rapports: Rapport[] = [];
    patients: Patient[] = [];
    rapportsSuivi: RapportSuiviStructure[] = [];

    // Search & filter
    searchQuery: string = '';
    filteredRapports: Rapport[] = [];

    // Loading states
    loading: boolean = true;

    constructor(
        private router: Router,
        private rapportService: RapportService,
        private patientService: PatientService,
        private rapportSuiviService: RapportSuiviService,
        private translate: TranslateService
    ) { }

    ngOnInit(): void {
        this.loadData();
        this.rapportsSuivi = this.rapportSuiviService.getRapportsSuiviStructure();
    }

    loadData(): void {
        this.loading = true;

        // Load patients
        this.patientService.getAll().subscribe({
            next: (patients) => this.patients = patients,
            error: (err) => console.error('Erreur chargement patients:', err)
        });

        // Load rapports
        this.rapportService.getAll().subscribe({
            next: (rapports) => {
                this.rapports = rapports;
                this.filteredRapports = [...rapports];
                this.loading = false;
            },
            error: (err) => {
                console.error('Erreur chargement rapports:', err);
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

    // === Search ===
    filterRapports(): void {
        const q = this.searchQuery.toLowerCase().trim();
        if (!q) {
            this.filteredRapports = [...this.rapports];
            return;
        }
        this.filteredRapports = this.rapports.filter(r =>
            (r.titre || '').toLowerCase().includes(q) ||
            (r.typeRapport || '').toLowerCase().includes(q) ||
            (r.patient?.nomComplet || '').toLowerCase().includes(q) ||
            (r.statut || '').toLowerCase().includes(q)
        );
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
        this.router.navigate(['/test']);
    }

    downloadReport(id: number): void {
        console.log(`Downloading report ${id}...`);
        alert(this.translate.instant('DOCTOR_REPORTS.DOWNLOAD_STARTED'));
    }

    goToCreateRapportSuivi(): void {
        this.router.navigate(['/doctor-report-create']);
    }
}
