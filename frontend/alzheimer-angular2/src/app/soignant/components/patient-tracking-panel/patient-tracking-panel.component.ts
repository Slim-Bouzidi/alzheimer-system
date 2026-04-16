import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription, combineLatest, takeUntil } from 'rxjs';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SoignantService } from '../../soignant.service';
import { PatientSoignant } from '../../../models/patient-soignant.model';
import { Alerte } from '../../../models/alerte.model';
import { PatientResumeJour, HistoriqueEntry, PatientTendances, NoteMedicale } from '../../../models/patient-tracking.model';

@Component({
    selector: 'app-patient-tracking-panel',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './patient-tracking-panel.component.html',
    styleUrls: ['./patient-tracking-panel.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientTrackingPanelComponent implements OnInit, OnDestroy, OnChanges {
    @Input() patientId!: string | null;
    @Input() currentDate!: Date;
    @Output() closePanel = new EventEmitter<void>();

    // State properties
    patient: PatientSoignant | null = null;
    resumeJour: PatientResumeJour | null = null;
    tendances: PatientTendances | null = null;
    derniereNote: NoteMedicale | null = null;
    alertesActives: Alerte[] = [];
    historiqueJour: HistoriqueEntry[] = [];
    suiviRempli: boolean = false;
    suiviHeure: string | null = null;
    loading: boolean = false;
    error: Error | null = null;
    debugMessage: string = '';

    // History and Filtering state
    showAllHistory: boolean = false;
    historyFilter: 'all' | 'alertes' | 'activites' = 'all';

    protected Math = Math;

    private destroy$ = new Subject<void>();
    private dataSubscription: Subscription | null = null;

    private soignantService = inject(SoignantService);
    private cdr = inject(ChangeDetectorRef);
    private translate = inject(TranslateService);

    constructor() { }

    ngOnInit(): void {
        this.subscribeToRealTimeUpdates();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['patientId'] || changes['currentDate']) {
            if (this.patientId) {
                this.loadPatientData();
            } else {
                this.patient = null;
                this.cdr.markForCheck();
            }
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
    }

    /**
     * Load all patient data simultaneously using combineLatest
     */
    loadPatientData(): void {
        if (!this.patientId) return;

        // Cancel previous loading to avoid race conditions
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }

        this.loading = true;
        this.error = null;
        this.cdr.markForCheck();

        const dateStr = this.currentDate.toISOString().split('T')[0];

        this.dataSubscription = combineLatest([
            this.soignantService.getPatient(this.patientId),
            this.soignantService.getPatientResumeJour(this.patientId, dateStr),
            this.soignantService.getPatientAlertesActives(this.patientId),
            this.soignantService.getPatientHistoriqueJour(this.patientId, dateStr),
            this.soignantService.isDailyTrackingFilled(this.patientId, dateStr),
            this.soignantService.getPatientTendances(this.patientId),
            this.soignantService.getLatestNoteMedicale(this.patientId)
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ([patient, resume, alertes, historique, suiviStatus, tendances, note]) => {
                    this.patient = patient;
                    this.resumeJour = resume;
                    this.tendances = tendances;
                    this.derniereNote = note;
                    this.alertesActives = alertes;
                    this.historiqueJour = historique;
                    this.suiviRempli = suiviStatus.filled;
                    this.suiviHeure = suiviStatus.time || null;
                    this.loading = false;
                    this.debugMessage = 'Data loaded at ' + new Date().toLocaleTimeString();
                    this.cdr.markForCheck();
                },
                error: (err) => {
                    this.error = err;
                    this.loading = false;
                    this.debugMessage = 'Error: ' + err.message;
                    this.cdr.markForCheck();
                    console.error('Error loading patient data:', err);
                }
            });
    }

    /**
     * Subscribe to real-time updates via RxJS Subjects
     */
    subscribeToRealTimeUpdates(): void {
        // Refresh when an event status changes or an alert is created
        this.soignantService.eventStatusChanged$
            .pipe(takeUntil(this.destroy$))
            .subscribe(update => {
                if (update.patientId === this.patientId) {
                    this.loadPatientData();
                }
            });

        this.soignantService.alerteCreated$
            .pipe(takeUntil(this.destroy$))
            .subscribe(alerte => {
                if (alerte.patientId === this.patientId) {
                    this.loadPatientData();
                }
            });

        this.soignantService.suiviQuotidienUpdated$
            .pipe(takeUntil(this.destroy$))
            .subscribe(update => {
                if (update.patientId === this.patientId) {
                    this.loadPatientData();
                }
            });
    }

    /**
     * Get status icon emoji based on status
     */
    getStatusIcon(statut: string): string {
        switch (statut) {
            case 'pris':
            case 'fait':
                return '✓';
            case 'a_venir':
            case 'a_faire':
                return '⏳';
            case 'en_retard':
                return '⚠️';
            default:
                return '○';
        }
    }

    /**
     * Get alert icon based on type
     */
    getAlerteIcon(type: string): string {
        switch (type) {
            case 'chute':
                return '🚨';
            case 'fugue':
                return '🚪';
            case 'comportement_anormal':
            case 'comportement':
                return '⚠️';
            case 'zone_interdite':
                return '🚫';
            case 'medicament':
                return '💊';
            default:
                return '🔔';
        }
    }

    /**
     * Get relative time string (e.g., "Il y a 15 min")
     */
    getRelativeTime(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return this.translate.instant('COMMON.JUST_NOW');
        if (diffMins < 60) return this.translate.instant('COMMON.MINUTES_AGO', { count: diffMins });
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return this.translate.instant('COMMON.HOURS_AGO', { count: diffHours });
        return this.translate.instant('COMMON.DAYS_AGO', { count: Math.floor(diffHours / 24) });
    }

    /**
     * Open daily tracking form modal
     */
    onRemplirSuivi(): void {
        // TODO: Open modal with daily tracking form
        console.log('Opening daily tracking form for patient:', this.patientId);
    }

    /**
     * View patient full profile
     */
    onVoirProfil(): void {
        // TODO: Navigate to patient profile page
        console.log('Navigate to patient profile:', this.patientId);
    }

    /**
     * Treat an alert with confirmation
     */
    onTraiterAlerte(alerteId: string): void {
        if (!this.patientId) return;

        if (confirm(this.translate.instant('SOIGNANT.CONFIRM_TREAT_ALERT'))) {
            this.soignantService.traiterAlerte(alerteId, this.patientId).subscribe(() => {
                // The list will auto-refresh via the reactive subscription in loadPatientData
                console.log('Alerte traitée:', alerteId);
            });
        }
    }

    /**
     * Handle quick actions
     */
    onQuickAction(action: string): void {
        console.log(`Action rapide déclenchée: ${action} pour le patient`, this.patientId);
        // Implement specific navigation or modals based on action
        if (action === 'appel') {
            alert(this.translate.instant('SOIGNANT.CALL_PATIENT_SIMULATED', { name: this.patient?.nom }));
        } else if (action === 'message') {
            alert(this.translate.instant('SOIGNANT.SEND_MESSAGE_SIMULATED'));
        }
    }

    /**
     * Toggle full history display
     */
    toggleHistory(): void {
        this.showAllHistory = !this.showAllHistory;
    }

    /**
     * Set history filter
     */
    setHistoryFilter(filter: 'all' | 'alertes' | 'activites'): void {
        this.historyFilter = filter;
    }

    /**
     * Get filtered history
     */
    getFilteredHistory(): HistoriqueEntry[] {
        let filtered = [...this.historiqueJour];
        if (this.historyFilter === 'alertes') {
            filtered = filtered.filter(h => (h.type as string) === 'alerte' || (h.type as string) === 'chute' || (h.type as string) === 'fugue');
        } else if (this.historyFilter === 'activites') {
            filtered = filtered.filter(h => h.type === 'activite' || h.type === 'medicament' || h.type === 'repas');
        }

        return this.showAllHistory ? filtered : filtered.slice(0, 5);
    }

    /**
     * Retry loading data after error
     */
    onRetry(): void {
        this.loadPatientData();
    }
}
