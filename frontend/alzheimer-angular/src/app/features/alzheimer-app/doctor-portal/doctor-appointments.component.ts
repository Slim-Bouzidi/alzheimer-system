import { TranslateModule } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RendezVousService, RendezVous } from '../../../core/services/alzheimer-app/rendez-vous.service';
import { PatientService, Patient } from '../../../core/services/alzheimer-app/patient.service';
import { SidebarComponent } from '../../../shared/sidebar-portal/sidebar.component';
import { TranslateFallbackPipe } from '../shared/pipes/translate-fallback.pipe';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr, 'fr-FR');

@Component({
    selector: 'app-doctor-appointments',
    standalone: true,
    imports: [TranslateModule, CommonModule, FormsModule, SidebarComponent, TranslateFallbackPipe],
    templateUrl: './doctor-appointments.component.html',
    styleUrls: ['./doctor-appointments.component.css']
})
export class DoctorAppointmentsComponent implements OnInit {

    currentDate: Date = new Date();
    selectedDate: Date | null = null;

    // Données CRUD
    rendezVous: RendezVous[] = [];
    filteredRendezVous: RendezVous[] = [];
    patients: Patient[] = [];
    currentRendezVous: RendezVous = {
        type: '',
        statut: 'PLANIFIE',
        lieu: '',
        motif: '',
        notes: '',
        duree: 30,
        envoyerRappel: true,
        telephone: ''
    };
    selectedRendezVous: RendezVous = {
        type: '',
        statut: 'PLANIFIE',
        lieu: '',
        motif: '',
        notes: '',
        duree: 30,
        envoyerRappel: true,
        telephone: ''
    };
    showAppointmentForm: boolean = false;
    isEditing: boolean = false;

    // Search & Filter
    searchQuery: string = '';
    activeFilter: string = 'all';

    // Formulaires
    dateRendez: string = '';
    heureRendez: string = '';
    todayDate: string = new Date().toISOString().split('T')[0];

    // Calendar Data
    calendarDays: any[] = [];
    currentMonth: string = '';
    currentYear: number = 0;
    displayMonth: number = 0;
    displayYear: number = 0;

    // Appointment Requests
    appointmentRequests: any[] = [];
    appointmentsApiAvailable: boolean = true;
    patientsApiAvailable: boolean = true;

    // Today's formatted date for topbar
    get todayFormatted(): string {
        return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Today's appointments
    get todayAppointments(): RendezVous[] {
        const today = new Date();
        return this.rendezVous
            .filter(rdv => rdv.dateHeure && this.isToday(rdv.dateHeure))
            .sort((a, b) => new Date(a.dateHeure!).getTime() - new Date(b.dateHeure!).getTime());
    }

    // Stats
    get confirmedCount(): number {
        return this.rendezVous.filter(r => r.statut === 'CONFIRME').length;
    }

    get pendingCount(): number {
        return this.rendezVous.filter(r => r.statut === 'PLANIFIE').length;
    }

    // Upcoming appointments for the UI
    get upcomingAppointments(): any[] {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.rendezVous
            .filter(rdv => rdv.dateHeure && new Date(rdv.dateHeure) >= today)
            .map(rdv => ({
                id: rdv.id,
                patient: rdv.patient?.nomComplet || 'Patient inconnu',
                date: rdv.dateHeure ? new Date(rdv.dateHeure).toLocaleDateString('fr-FR') : '',
                time: rdv.dateHeure ? new Date(rdv.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
                type: rdv.type,
                status: rdv.statut
            }))
            .slice(0, 5);
    }

    constructor(
        private router: Router,
        private rendezVousService: RendezVousService,
        private patientService: PatientService
    ) { }

    private readonly translate = {
        instant: (key: string) => key
    };

    ngOnInit(): void {
        this.initializeCalendar();
        this.loadMockData();
    }

    // Charger les données depuis l'API Spring Boot
    loadMockData(): void {
        // Charger les patients depuis l'API
        this.patientService.getAll().subscribe({
            next: (patients) => {
                this.patients = patients;
                console.log('Patients chargés depuis la base de données:', patients);
            },
            error: (err) => {
                console.error('Erreur chargement patients depuis le backend:', err);
                this.patientsApiAvailable = false;
                this.loadMockPatients();
            }
        });

        // Charger les rendez-vous depuis l'API
        this.rendezVousService.getAll().subscribe({
            next: (rendezVous) => {
                this.rendezVous = rendezVous;
                this.filterRendezVous();
                this.updateCalendarFromRendezVous();
                console.log('Rendez-vous chargés depuis la base de données:', rendezVous);
            },
            error: (err) => {
                console.error('Erreur chargement rendez-vous depuis le backend:', err);
                this.appointmentsApiAvailable = false;
                this.loadMockRendezVous();
            }
        });

        // Initialiser le calendrier
        this.initializeCalendar();
    }

    // Données mock temporaires pour les patients
    private loadMockPatients(): void {
        console.log('Chargement des patients mock en attente du backend...');
        this.patients = [
            { 
                id: 1, 
                nom: 'Dupont', 
                prenom: 'Marie', 
                nomComplet: 'Marie Dupont', 
                age: 78,
                gender: 'F',
                condition: 'Troubles cognitifs',
                lastVisit: '2023-10-25',
                status: 'high-risk',
                telephone: '06 12 34 56 78',
                numeroDeTelephone: '06 12 34 56 78',
                actif: true,
                dateNaissance: '1945-03-15',
                adresse: '123 Rue de la Paix, 75001 Paris',
                antecedents: 'Hypertension, Diabète Type 2',
                allergies: 'Pénicilline',
                nbInterventionsMois: 3,
                derniereVisite: '2023-10-25'
            },
            { 
                id: 2, 
                nom: 'Martin', 
                prenom: 'Jean', 
                nomComplet: 'Jean Martin', 
                age: 82,
                gender: 'H',
                condition: 'Hypertension',
                lastVisit: '2023-10-20',
                status: 'stable',
                telephone: '06 23 45 67 89',
                numeroDeTelephone: '06 23 45 67 89',
                actif: true,
                dateNaissance: '1941-07-22',
                adresse: '45 Avenue des Champs-Élysées, 75008 Paris',
                antecedents: 'Maladie de Parkinson',
                allergies: 'Aucune',
                nbInterventionsMois: 2,
                derniereVisite: '2023-10-20'
            },
            { 
                id: 3, 
                nom: 'Bernard', 
                prenom: 'Alice', 
                nomComplet: 'Alice Bernard', 
                age: 75,
                gender: 'F',
                condition: 'Diabète Type 2',
                lastVisit: '2023-10-15',
                status: 'stable',
                telephone: '06 34 56 78 90',
                numeroDeTelephone: '06 34 56 78 90',
                actif: true,
                dateNaissance: '1948-11-08',
                adresse: '78 Boulevard Saint-Michel, 75005 Paris',
                antecedents: 'Arthrite rhumatoïde',
                allergies: 'Pollens',
                nbInterventionsMois: 4,
                derniereVisite: '2023-10-15'
            },
            { 
                id: 4, 
                nom: 'Durand', 
                prenom: 'Paul', 
                nomComplet: 'Paul Durand', 
                age: 85,
                gender: 'H',
                condition: 'Parkinson',
                lastVisit: '2023-10-10',
                status: 'attention',
                telephone: '06 45 67 89 01',
                numeroDeTelephone: '06 45 67 89 01',
                actif: true,
                dateNaissance: '1938-02-14',
                adresse: '21 Rue du Faubourg Saint-Honoré, 75001 Paris',
                antecedents: 'Troubles cognitifs légers',
                allergies: 'Noix',
                nbInterventionsMois: 1,
                derniereVisite: '2023-10-10'
            },
            { 
                id: 5, 
                nom: 'Leroy', 
                prenom: 'Sophie', 
                nomComplet: 'Sophie Leroy', 
                age: 72,
                gender: 'F',
                condition: 'Arthrite',
                lastVisit: '2023-10-05',
                status: 'stable',
                telephone: '06 56 78 90 12',
                numeroDeTelephone: '06 56 78 90 12',
                actif: true,
                dateNaissance: '1951-09-30',
                adresse: '156 Rue de Rivoli, 75004 Paris',
                antecedents: 'Ostéoporose',
                allergies: 'Acariens',
                nbInterventionsMois: 2,
                derniereVisite: '2023-10-05'
            }
        ];
        console.log('Patients mock chargés. Patients disponibles:', this.patients.length);
    }

    // Données mock temporaires pour les rendez-vous
    private loadMockRendezVous(): void {
        console.log('Chargement des rendez-vous mock en attente du backend...');
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        this.rendezVous = [
            {
                id: 1,
                patient: this.patients[0],
                type: 'CONSULTATION',
                statut: 'PLANIFIE',
                lieu: 'Cabinet médical',
                motif: 'Suivi régulier',
                notes: 'Patient stable',
                duree: 30,
                envoyerRappel: true,
                dateHeure: today.toISOString(),
                telephone: '06 12 34 56 78'
            },
            {
                id: 2,
                patient: this.patients[1],
                type: 'CONSULTATION',
                statut: 'PLANIFIE',
                lieu: 'Cabinet médical',
                motif: 'Contrôle tension',
                notes: 'Tension à surveiller',
                duree: 20,
                envoyerRappel: true,
                dateHeure: tomorrow.toISOString(),
                telephone: '06 23 45 67 89'
            }
        ];
        this.updateCalendarFromRendezVous();
        this.filterRendezVous();
        console.log('Rendez-vous mock chargés. Rendez-vous disponibles:', this.rendezVous.length);
    }

    // Initialiser le calendrier
    private initializeCalendar(): void {
        const now = new Date();
        this.displayMonth = now.getMonth();
        this.displayYear = now.getFullYear();
        this.buildCalendar(this.displayYear, this.displayMonth);
    }

    // Construire le calendrier pour un mois donné
    private buildCalendar(year: number, month: number): void {
        this.currentYear = year;
        this.currentMonth = new Date(year, month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        // Capitalize first letter
        this.currentMonth = this.currentMonth.charAt(0).toUpperCase() + this.currentMonth.slice(1);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Ajuster pour commencer le lundi (0=Lun, 6=Dim)
        let startOffset = firstDay.getDay() - 1;
        if (startOffset < 0) startOffset = 6; // Dimanche -> décalage de 6

        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startOffset);

        this.calendarDays = [];
        for (let i = 0; i < 42; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);

            const isToday = d.getFullYear() === today.getFullYear() &&
                            d.getMonth() === today.getMonth() &&
                            d.getDate() === today.getDate();

            const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            this.calendarDays.push({
                date: d.getDate(),
                fullDate: new Date(d),
                isCurrentMonth: d.getMonth() === month,
                isToday: isToday,
                hasAppointment: false,
                appointmentCount: 0,
                isSelected: false,
                isWeekend: isWeekend
            });
        }

        // Marquer les rendez-vous
        this.markAppointmentsOnCalendar();
    }

    // Navigation mois précédent
    prevMonth(): void {
        this.displayMonth--;
        if (this.displayMonth < 0) {
            this.displayMonth = 11;
            this.displayYear--;
        }
        this.buildCalendar(this.displayYear, this.displayMonth);
    }

    // Navigation mois suivant
    nextMonth(): void {
        this.displayMonth++;
        if (this.displayMonth > 11) {
            this.displayMonth = 0;
            this.displayYear++;
        }
        this.buildCalendar(this.displayYear, this.displayMonth);
    }

    // Mettre à jour le calendrier avec les rendez-vous
    updateCalendarFromRendezVous(): void {
        this.markAppointmentsOnCalendar();
    }

    private markAppointmentsOnCalendar(): void {
        // Réinitialiser
        this.calendarDays.forEach(day => {
            day.hasAppointment = false;
            day.appointmentCount = 0;
        });

        // Marquer les jours avec rendez-vous
        this.rendezVous.forEach(rdv => {
            if (rdv.dateHeure) {
                const rdvDate = new Date(rdv.dateHeure);
                const day = this.calendarDays.find(d =>
                    d.fullDate.getFullYear() === rdvDate.getFullYear() &&
                    d.fullDate.getMonth() === rdvDate.getMonth() &&
                    d.fullDate.getDate() === rdvDate.getDate()
                );
                if (day) {
                    day.hasAppointment = true;
                    day.appointmentCount++;
                }
            }
        });
    }

    logout(): void {
        this.router.navigate(['/test']);
    }

    selectDate(day: any): void {
        // Déselectionner l'ancien
        this.calendarDays.forEach(d => d.isSelected = false);
        day.isSelected = true;
        this.selectedDate = day.fullDate;
        console.log('Selected date:', day.fullDate);
    }

    approveRequest(id: number): void {
        console.log('Approved request:', id);
        this.appointmentRequests = this.appointmentRequests.filter(r => r.id !== id);
        // Mock move to upcoming
    }

    declineRequest(id: number): void {
        console.log('Declined request:', id);
        this.appointmentRequests = this.appointmentRequests.filter(r => r.id !== id);
    }

    scheduleNew(): void {
        this.showAddForm();
    }

    // CRUD Methods (Mock pour le moment)

    // Afficher le formulaire d'ajout
    showAddForm(): void {
        this.currentRendezVous = {
            type: '',
            statut: 'PLANIFIE',
            lieu: '',
            motif: '',
            notes: '',
            duree: 30,
            envoyerRappel: true,
            telephone: ''
        };
        this.dateRendez = '';
        this.heureRendez = '';
        this.isEditing = false;
        this.showAppointmentForm = true;
    }

    // Sauvegarder (créer ou modifier)
    saveRendezVous(): void {
        // Combiner date et heure
        if (this.dateRendez && this.heureRendez) {
            const dateTime = new Date(`${this.dateRendez}T${this.heureRendez}`);
            this.currentRendezVous.dateHeure = dateTime.toISOString();
        }

        // Définir des valeurs par défaut pour les champs supprimés
        this.currentRendezVous.typeRdv = this.currentRendezVous.type || 'CONSULTATION';
        this.currentRendezVous.dureeMinutes = this.currentRendezVous.duree || 30;
        this.currentRendezVous.lieu = this.currentRendezVous.lieu || 'Cabinet médical';
        this.currentRendezVous.motif = this.currentRendezVous.motif || 'Rendez-vous médical';
        this.currentRendezVous.notes = this.currentRendezVous.notes || '';

        // Préparer l'objet pour le back-end
        const rdvToSend: any = {
            titre: this.currentRendezVous.motif || 'Rendez-vous',
            description: this.currentRendezVous.notes,
            dateHeure: this.currentRendezVous.dateHeure,
            dureeMinutes: this.currentRendezVous.dureeMinutes,
            typeRdv: this.currentRendezVous.typeRdv,
            statut: this.currentRendezVous.statut || 'PLANIFIE',
            lieu: this.currentRendezVous.lieu,
            motif: this.currentRendezVous.motif,
            notes: this.currentRendezVous.notes,
            patient: { id: Number(this.currentRendezVous.patient?.id || this.currentRendezVous.patient) }
        };

        if (this.isEditing && this.currentRendezVous.id) {
            // Modification via API
            this.rendezVousService.update(this.currentRendezVous.id, rdvToSend).subscribe({
                next: (updated) => {
                    const index = this.rendezVous.findIndex(r => r.id === this.currentRendezVous.id);
                    if (index !== -1) {
                        this.rendezVous[index] = updated;
                    }
                    alert(this.translate.instant('DOCTOR_APPOINTMENTS.SUCCESS_MODIFIED'));
                    this.cancelForm();
                    this.filterRendezVous();
                    this.updateCalendarFromRendezVous();
                },
                error: (err) => {
                    console.error('Erreur modification rendez-vous:', err);
                    alert(this.translate.instant('DOCTOR_APPOINTMENTS.ERROR_MODIFY'));
                }
            });
        } else {
            // Création via API
            this.rendezVousService.create(rdvToSend).subscribe({
                next: (created) => {
                    this.rendezVous.push(created);
                    alert(this.translate.instant('DOCTOR_APPOINTMENTS.SUCCESS_PLANNED'));
                    this.cancelForm();
                    this.filterRendezVous();
                    this.updateCalendarFromRendezVous();
                },
                error: (err) => {
                    console.error('Erreur création rendez-vous:', err);
                    alert(this.translate.instant('DOCTOR_APPOINTMENTS.ERROR_CREATE'));
                }
            });
        }
    }

    // Modifier un rendez-vous
    editRendezVous(rdv: RendezVous): void {
        this.currentRendezVous = { ...rdv };
        if (rdv.dateHeure) {
            this.dateRendez = new Date(rdv.dateHeure).toISOString().split('T')[0];
            this.heureRendez = new Date(rdv.dateHeure).toTimeString().slice(0, 5);
        }
        this.isEditing = true;
        this.showAppointmentForm = true;
    }

    // Supprimer un rendez-vous
    deleteRendezVous(id: number): void {
        if (confirm(this.translate.instant('DOCTOR_APPOINTMENTS.CONFIRM_DELETE'))) {
            this.rendezVousService.delete(id).subscribe({
                next: () => {
                    this.rendezVous = this.rendezVous.filter(r => r.id !== id);
                    alert(this.translate.instant('DOCTOR_APPOINTMENTS.SUCCESS_DELETED'));
                    this.filterRendezVous();
                    this.updateCalendarFromRendezVous();
                },
                error: (err) => {
                    console.error('Erreur suppression rendez-vous:', err);
                    alert(this.translate.instant('DOCTOR_APPOINTMENTS.ERROR_DELETE'));
                }
            });
        }
    }

    // Annuler le formulaire
    cancelForm(): void {
        this.showAppointmentForm = false;
        this.currentRendezVous = {
            type: '',
            statut: 'PLANIFIE',
            lieu: '',
            motif: '',
            notes: '',
            duree: 30,
            envoyerRappel: true,
            telephone: ''
        };
        this.dateRendez = '';
        this.heureRendez = '';
    }

    // Validation du formulaire
    isFormValid(): boolean {
        return !!(this.currentRendezVous.patient && 
                  this.dateRendez && 
                  this.heureRendez);
    }

    // Anciennes méthodes gardées pour compatibilité
    openAppointmentForm(): void {
        this.showAddForm();
    }

    closeAppointmentForm(): void {
        this.cancelForm();
    }

    resetAppointmentForm(): void {
        this.cancelForm();
    }

    submitAppointment(): void {
        this.saveRendezVous();
    }

    // Obtenir les patients récents pour le dashboard
    getRecentPatients(): Patient[] {
        // Retourner les 5 premiers patients ou tous si moins de 5
        return this.patients.slice(0, 5);
    }

    // Navigation vers la page patients
    goToPatients(): void {
        this.router.navigate(['/doctor-patients']);
    }

    // Voir les détails d'un patient
    viewPatientDetails(patient: Patient): void {
        // Naviguer vers la page patient avec l'ID
        if (patient.id) {
            this.router.navigate(['/doctor-patients'], { 
                queryParams: { patientId: patient.id } 
            });
        }
    }

    // Obtenir les initiales d'un patient
    getPatientInitials(patient: Patient): string {
        const prenom = patient.prenom || patient.nomComplet?.split(' ')[0] || '?';
        const nom = patient.nom || patient.nomComplet?.split(' ').slice(-1)[0] || '?';
        return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
    }

    // Obtenir le label du statut
    getStatusLabel(status: string): string {
        switch (status) {
            case 'high-risk': return this.translate.instant('DOCTOR_APPOINTMENTS.STATUS_HIGH_RISK');
            case 'attention': return this.translate.instant('DOCTOR_APPOINTMENTS.STATUS_ATTENTION');
            case 'stable': return this.translate.instant('DOCTOR_APPOINTMENTS.STATUS_STABLE');
            default: return status;
        }
    }

    getPatientName(patientId: string): string {
        const patient = this.patients.find(p => p.id?.toString() === patientId);
        return patient?.nomComplet ?? 'Patient inconnu';
    }

    // Obtenir un patient par son ID
    getPatientById(patientId: string): Patient | undefined {
        return this.patients.find(p => p.id?.toString() === patientId);
    }

    getAppointmentTypeLabel(type: string): string {
        const types: { [key: string]: string } = {
            'CONSULTATION': this.translate.instant('DOCTOR_APPOINTMENTS.CONSULTATION'),
            'URGENCE': this.translate.instant('DOCTOR_APPOINTMENTS.EMERGENCY'),
            'SUIVI': this.translate.instant('DOCTOR_APPOINTMENTS.FOLLOW_UP'),
            'REEDUCATION': this.translate.instant('DOCTOR_APPOINTMENTS.REHABILITATION'),
            'EVALUATION': this.translate.instant('DOCTOR_APPOINTMENTS.EVALUATION'),
            'COGNITIVE_TEST': this.translate.instant('DOCTOR_APPOINTMENTS.COGNITIVE_TEST'),
            'EMERGENCY': this.translate.instant('DOCTOR_APPOINTMENTS.EMERGENCY'),
            'FIRST_VISIT': this.translate.instant('DOCTOR_APPOINTMENTS.FIRST_VISIT'),
            'VISITE_DOMICILE': this.translate.instant('DOCTOR_APPOINTMENTS.HOME_VISIT'),
            'TELECONSULTATION': this.translate.instant('DOCTOR_APPOINTMENTS.TELECONSULTATION')
        };
        return types[type] || type || '-';
    }

    getStatutLabel(statut: string): string {
        const statuts: { [key: string]: string } = {
            'PLANIFIE': this.translate.instant('DOCTOR_APPOINTMENTS.STATUS_PLANNED'),
            'CONFIRME': this.translate.instant('DOCTOR_APPOINTMENTS.STATUS_CONFIRMED'),
            'TERMINE': this.translate.instant('DOCTOR_APPOINTMENTS.STATUS_COMPLETED'),
            'ANNULE': this.translate.instant('DOCTOR_APPOINTMENTS.STATUS_CANCELLED')
        };
        return statuts[statut] || statut;
    }

    updateCalendar(date: string): void {
        this.buildCalendar(this.displayYear, this.displayMonth);
    }

    // ===== New Methods for Enhanced Dashboard =====

    // Go to today in calendar
    goToToday(): void {
        const now = new Date();
        this.displayMonth = now.getMonth();
        this.displayYear = now.getFullYear();
        this.buildCalendar(this.displayYear, this.displayMonth);
    }

    // Filter rendez-vous based on search and status filter
    filterRendezVous(): void {
        let result = [...this.rendezVous];

        // Filter by status
        if (this.activeFilter !== 'all') {
            result = result.filter(r => r.statut === this.activeFilter);
        }

        // Filter by search query
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase().trim();
            result = result.filter(r =>
                (r.patient?.nomComplet || '').toLowerCase().includes(query) ||
                (r.motif || '').toLowerCase().includes(query) ||
                (r.typeRdv || r.type || '').toLowerCase().includes(query)
            );
        }

        // Sort by date (newest first)
        result.sort((a, b) => {
            const dateA = a.dateHeure ? new Date(a.dateHeure).getTime() : 0;
            const dateB = b.dateHeure ? new Date(b.dateHeure).getTime() : 0;
            return dateB - dateA;
        });

        this.filteredRendezVous = result;
    }

    // Set filter and re-filter
    setFilter(filter: string): void {
        this.activeFilter = filter;
        this.filterRendezVous();
    }

    // Clear all filters
    clearFilters(): void {
        this.searchQuery = '';
        this.activeFilter = 'all';
        this.filterRendezVous();
    }

    // Check if a date is today
    isToday(dateHeure: string | undefined): boolean {
        if (!dateHeure) return false;
        const date = new Date(dateHeure);
        const today = new Date();
        return date.getFullYear() === today.getFullYear() &&
               date.getMonth() === today.getMonth() &&
               date.getDate() === today.getDate();
    }

    // Check if a date is in the past
    isPast(dateHeure: string | undefined): boolean {
        if (!dateHeure) return false;
        const date = new Date(dateHeure);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    }

    // Check if a RDV is in the past (time-based)
    isRdvPast(rdv: RendezVous): boolean {
        if (!rdv.dateHeure) return false;
        return new Date(rdv.dateHeure) < new Date();
    }

    // Check if a RDV is currently happening (within 30 min window)
    isRdvCurrent(rdv: RendezVous): boolean {
        if (!rdv.dateHeure) return false;
        const rdvTime = new Date(rdv.dateHeure).getTime();
        const now = new Date().getTime();
        const duration = (rdv.dureeMinutes || rdv.duree || 30) * 60 * 1000;
        return now >= rdvTime && now <= rdvTime + duration;
    }

    // Get patient initials from a rendez-vous
    getPatientInitialsFromRdv(rdv: RendezVous): string {
        if (rdv.patient) {
            return this.getPatientInitials(rdv.patient as any);
        }
        return '?';
    }

    // Confirm a rendez-vous
    confirmRendezVous(rdv: RendezVous): void {
        if (!rdv.id) return;
        const updated = { ...rdv, statut: 'CONFIRME' };
        this.rendezVousService.update(rdv.id, updated).subscribe({
            next: (result) => {
                const index = this.rendezVous.findIndex(r => r.id === rdv.id);
                if (index !== -1) {
                    this.rendezVous[index] = result;
                    this.filterRendezVous();
                }
            },
            error: (err) => {
                console.error('Erreur confirmation:', err);
                // Fallback: update locally
                const index = this.rendezVous.findIndex(r => r.id === rdv.id);
                if (index !== -1) {
                    this.rendezVous[index].statut = 'CONFIRME';
                    this.filterRendezVous();
                }
            }
        });
    }
}
