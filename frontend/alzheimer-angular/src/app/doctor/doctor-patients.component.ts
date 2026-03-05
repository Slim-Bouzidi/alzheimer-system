import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { NotificationBellComponent } from '../shared/components/notification-bell/notification-bell.component';
import { PatientService, Patient } from '../services/patient.service';
import { UserService, User } from '../services/user.service';
import { EmergencyContactService } from '../services/emergency-contact.service';
import { MedicalRecordService } from '../services/medical-record.service';
import { TreatmentService } from '../services/treatment.service';
import { RapportService, Rapport } from '../services/rapport.service';
import { TranslateModule } from '@ngx-translate/core';
import keycloak from '../keycloak';
import { FormValidator, ValidationErrors, sanitizeObject } from '../shared/validation.utils';

@Component({
    selector: 'app-doctor-patients',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent, NotificationBellComponent, TranslateModule],
    templateUrl: './doctor-patients.component.html',
    styleUrls: ['./doctor-patients.component.css', './report-medical-pro.css']
})
export class DoctorPatientsComponent implements OnInit {

    userName = keycloak.tokenParsed?.['name'] || keycloak.tokenParsed?.['preferred_username'] || 'Médecin';

    patients: Patient[] = [];
    filteredPatients: Patient[] = [];
    soignants: User[] = [];
    searchTerm: string = '';
    isLoading: boolean = false;
    error: string = '';

    // Dialog display state
    showAddPatientDialog: boolean = false;
    showEmergencyContactDialog: boolean = false;
    showMedicalRecordDialog: boolean = false;
    showTreatmentDialog: boolean = false;
    showReportDialog: boolean = false;
    reportGenerating: boolean = false;
    reportSaved: boolean = false;
    generatedReportPreview: any = null;
    selectedPatient: Patient | null = null;

    // Modèle pour le nouveau patient (côté front, mappé sur l'entité Spring)
    newPatient: any = {
        nomComplet: '',
        dateNaissance: '',
        adresse: '',
        numeroDeTelephone: '',
        antecedents: '',
        allergies: '',
        actif: true
    };

    // Modèle pour le nouveau contact d'urgence
    newEmergencyContact: any = {
        fullName: '',
        relationship: '',
        phone: '',
        email: ''
    };

    // Validation errors for current form
    formErrors: ValidationErrors = {};

    // Modèle pour le nouveau dossier médical
    newMedicalRecord: any = {
        diagnosis: '',
        diseaseStage: '',
        medicalHistory: '',
        allergies: ''
    };

    // Modèle pour le nouveau traitement
    newTreatment: any = {
        treatmentName: '',
        dosage: '',
        frequency: '',
        startDate: '',
        endDate: '',
        status: 'Active'
    };

    constructor(
        private router: Router,
        private patientService: PatientService,
        private userService: UserService,
        private emergencyContactService: EmergencyContactService,
        private medicalRecordService: MedicalRecordService,
        private treatmentService: TreatmentService,
        private rapportService: RapportService
    ) { }

    ngOnInit(): void {
        this.loadPatientsFromDatabase();
        this.loadSoignants();
    }

    loadSoignants(): void {
        this.userService.getByRole('SOIGNANT').subscribe({
            next: (soignants) => {
                this.soignants = soignants;
                console.log('Soignants chargés:', soignants);
            },
            error: (err) => console.error('Erreur chargement soignants:', err)
        });
    }

    // Charger les patients depuis la base de données réelle (Spring Boot)
    loadPatientsFromDatabase(): void {
        this.isLoading = true;
        this.error = '';
        
        this.patientService.getAll().subscribe({
            next: (data) => {
                // Les patients viennent directement du backend avec les bons champs
                this.patients = (data as any[]).map((p: any) => ({
                    id: p.id,
                    nomComplet: p.nomComplet || '',
                    dateNaissance: p.dateNaissance,
                    adresse: p.adresse,
                    numeroDeTelephone: p.numeroDeTelephone,
                    antecedents: p.antecedents,
                    allergies: p.allergies,
                    nbInterventionsMois: p.nbInterventionsMois || 0,
                    derniereVisite: p.derniereVisite,
                    actif: p.actif ?? true,
                    soignant: p.soignant || null,
                    // UI
                    nom: p.nomComplet?.split(' ').slice(1).join(' ') || '',
                    prenom: p.nomComplet?.split(' ')[0] || ''
                }));
                this.filteredPatients = [...this.patients];
                this.isLoading = false;
                console.log('Patients chargés depuis la base de données:', data);
                // Load sub-collections (treatments, medical records, emergency contacts)
                this.loadAllSubCollections();
            },
            error: (err) => {
                this.error = 'Erreur de connexion à la base de données: ' + err.message;
                this.isLoading = false;
                console.error('Erreur de connexion au backend Spring Boot:', err);
                // Charger les données mock temporairement pour permettre l'utilisation
                this.loadMockData();
            }
        });
    }

    // Load treatments, medical records, and emergency contacts for all patients
    private loadAllSubCollections(): void {
        for (const patient of this.patients) {
            if (!patient.id) continue;
            const pid = patient.id;

            this.treatmentService.getByPatient(pid).pipe(catchError(() => of([]))).subscribe(
                (treatments) => {
                    // Ensure each treatment has idTreatment property for delete compatibility
                    patient.treatments = (treatments || []).map((t: any) => ({
                        ...t,
                        idTreatment: t.idTreatment ?? t.id // fallback if backend returns 'id'
                    }));
                }
            );
            this.medicalRecordService.getByPatient(pid).pipe(catchError(() => of([]))).subscribe(
                (records) => { patient.medicalRecords = records; }
            );
            this.emergencyContactService.getByPatient(pid).pipe(catchError(() => of([]))).subscribe(
                (contacts) => { patient.emergencyContacts = contacts; }
            );
        }
    }

    // Données mock temporaires (à remplacer par le backend)
    private loadMockData(): void {
        console.log('Chargement des données mock en attente du backend Spring Boot...');
        this.patients = [
            { 
                id: 1, 
                nomComplet: 'Marie Dupont', 
                actif: true,
                dateNaissance: '1945-03-15',
                adresse: '123 Rue de la Paix, 75001 Paris',
                numeroDeTelephone: '06 12 34 56 78',
                antecedents: 'Hypertension, Diabète Type 2',
                allergies: 'Pénicilline',
                nbInterventionsMois: 3,
                derniereVisite: '2023-10-25'
            },
            { 
                id: 2, 
                nomComplet: 'Jean Martin', 
                actif: true,
                dateNaissance: '1941-07-22',
                adresse: '45 Avenue des Champs-Élysées, 75008 Paris',
                numeroDeTelephone: '06 23 45 67 89',
                antecedents: 'Maladie de Parkinson',
                allergies: 'Aucune',
                nbInterventionsMois: 2,
                derniereVisite: '2023-10-20'
            },
            { 
                id: 3, 
                nomComplet: 'Alice Bernard', 
                actif: true,
                dateNaissance: '1948-11-08',
                adresse: '78 Boulevard Saint-Michel, 75005 Paris',
                numeroDeTelephone: '06 34 56 78 90',
                antecedents: 'Arthrite rhumatoïde',
                allergies: 'Pollens',
                nbInterventionsMois: 4,
                derniereVisite: '2023-10-15'
            },
            { 
                id: 4, 
                nomComplet: 'Paul Durand', 
                actif: true,
                dateNaissance: '1938-02-14',
                adresse: '21 Rue du Faubourg Saint-Honoré, 75001 Paris',
                numeroDeTelephone: '06 45 67 89 01',
                antecedents: 'Troubles cognitifs légers',
                allergies: 'Noix',
                nbInterventionsMois: 1,
                derniereVisite: '2023-10-10'
            },
            { 
                id: 5, 
                nomComplet: 'Sophie Leroy', 
                actif: true,
                dateNaissance: '1951-09-30',
                adresse: '156 Rue de Rivoli, 75004 Paris',
                numeroDeTelephone: '06 56 78 90 12',
                antecedents: 'Ostéoporose',
                allergies: 'Acariens',
                nbInterventionsMois: 2,
                derniereVisite: '2023-10-05'
            }
        ];
        this.filteredPatients = [...this.patients];
        console.log('Données mock chargées. Patients disponibles:', this.patients.length);
    }

    filterPatients(event: any): void {
        const term = event.target.value.toLowerCase();
        this.searchTerm = term;
        this.filteredPatients = this.patients.filter(p =>
            p.nomComplet.toLowerCase().includes(term) ||
            (p.antecedents && p.antecedents.toLowerCase().includes(term)) ||
            (p.numeroDeTelephone && p.numeroDeTelephone.includes(term))
        );
    }

    getPatientInitials(patient: Patient): string {
        const parts = (patient.nomComplet || '?').split(' ');
        const first = parts[0]?.charAt(0) || '?';
        const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
        return `${first}${last}`.toUpperCase();
    }

    getStatusLabel(status: string | undefined): string {
        switch ((status || '').toLowerCase()) {
            case 'high-risk': return 'High risk';
            case 'attention': return 'Surveillance';
            case 'stable': return 'Stable';
            default: return status || 'Stable';
        }
    }

    /** Retourne la classe CSS du badge/avatar selon le statut */
    deletePatient(patient: Patient): void {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${patient.nomComplet} ?`)) {
            return;
        }

        const patientId = patient.id;
        if (!patientId) {
            console.error('ID patient manquant');
            return;
        }

        this.patientService.delete(patientId).subscribe({
            next: () => {
                console.log(`Patient ${patientId} supprimé avec succès`);
                // Retirer le patient de la liste locale
                this.patients = this.patients.filter(p => p.id !== patientId);
                this.filteredPatients = this.filteredPatients.filter(p => p.id !== patientId);
                alert(`Patient ${patient.nomComplet} a été supprimé avec succès.`);
            },
            error: (err) => {
                console.error('Erreur lors de la suppression du patient:', err);
                alert(`Erreur lors de la suppression du patient: ${err.message}`);
            }
        });
    }

    toggleStatusDropdown(patient: any): void {
        patient.showStatusDropdown = !patient.showStatusDropdown;
    }

    updatePatientStatus(patient: Patient, newStatus: string): void {
        if (!patient.id) {
            console.error('ID patient manquant');
            return;
        }

        // Préparer le patient avec le nouveau statut pour l'envoi au backend
        const updatedPatient: Patient = {
            id: patient.id,
            nomComplet: patient.nomComplet,
            dateNaissance: patient.dateNaissance,
            adresse: patient.adresse || '',
            numeroDeTelephone: patient.numeroDeTelephone,
            antecedents: patient.antecedents,
            allergies: patient.allergies,
            actif: newStatus !== 'inactive'
        };

        this.patientService.update(patient.id, updatedPatient).subscribe({
            next: (response) => {
                console.log('Statut du patient mis à jour:', response);
                patient.actif = newStatus !== 'inactive';
                patient.showStatusDropdown = false;
                alert(`Statut de ${patient.nomComplet} mis à jour vers ${newStatus === 'inactive' ? 'Inactif' : 'Actif'}`);
            },
            error: (err) => {
                console.error('Erreur lors de la mise à jour du statut:', err);
                alert(`Erreur lors de la mise à jour du statut: ${err.message}`);
                patient.showStatusDropdown = false;
            }
        });
    }

    getStatusClass(status: string | undefined): string {
        switch ((status || '').toLowerCase()) {
            case 'high-risk': return 'high-risk';
            case 'attention': return 'attention';
            case 'stable': return 'stable';
            default: return 'stable';
        }
    }

    logout(): void {
        import('../keycloak').then(m => m.default.logout({ redirectUri: window.location.origin }));
    }

    // Opens/closes the add patient dialog
    addPatient(): void {
        this.showAddPatientDialog = !this.showAddPatientDialog;
        this.formErrors = {};
        if (!this.showAddPatientDialog) {
            this.resetPatientForm();
        }
    }

    // Reset the patient form to initial state
    private resetPatientForm(): void {
        this.newPatient = {
            nomComplet: '',
            dateNaissance: '',
            adresse: '',
            numeroDeTelephone: '',
            antecedents: '',
            allergies: '',
            actif: true
        };
    }

    // Submit form to create a new patient
    submitNewPatient(): void {
        const v = new FormValidator();
        v.required('nomComplet', this.newPatient.nomComplet, 'Le nom complet est requis.');
        v.minLength('nomComplet', this.newPatient.nomComplet, 2, 'Le nom doit contenir au moins 2 caractères.');
        v.maxLength('nomComplet', this.newPatient.nomComplet, 100, 'Le nom ne doit pas dépasser 100 caractères.');
        v.dateValid('dateNaissance', this.newPatient.dateNaissance, 'Date de naissance invalide.');
        v.phone('numeroDeTelephone', this.newPatient.numeroDeTelephone, 'Numéro de téléphone invalide (8-20 chiffres).');
        v.maxLength('adresse', this.newPatient.adresse, 255, 'L\'adresse ne doit pas dépasser 255 caractères.');
        v.maxLength('antecedents', this.newPatient.antecedents, 500, 'Les antécédents ne doivent pas dépasser 500 caractères.');
        v.maxLength('allergies', this.newPatient.allergies, 500, 'Les allergies ne doivent pas dépasser 500 caractères.');

        this.formErrors = v.errors;
        if (v.hasErrors()) return;

        const sanitized = sanitizeObject(this.newPatient);
        const patientBody = {
            nomComplet: sanitized.nomComplet,
            dateNaissance: sanitized.dateNaissance || null,
            adresse: sanitized.adresse || null,
            numeroDeTelephone: sanitized.numeroDeTelephone || null,
            antecedents: sanitized.antecedents || null,
            allergies: sanitized.allergies || null,
            actif: this.newPatient.actif ?? true
        };

        this.isLoading = true;

        this.patientService.create(patientBody).subscribe({
            next: (createdPatient: any) => {
                console.log('Patient créé:', createdPatient);
                alert('Patient ajouté avec succès.');
                this.isLoading = false;
                
                // Close dialog and reset form
                this.showAddPatientDialog = false;
                this.resetPatientForm();
                
                // Reload patients list
                this.loadPatientsFromDatabase();
            },
            error: (err) => {
                console.error('Erreur création patient:', err);
                this.isLoading = false;
                alert('Erreur lors de la création du patient: ' + (err.error?.message || err.message));
            }
        });
    }

    assignerSoignant(patient: Patient, event: Event): void {
        const select = event.target as HTMLSelectElement;
        const soignantId = select.value ? Number(select.value) : null;

        if (!patient.id) return;

        this.patientService.assignerSoignant(patient.id, soignantId).subscribe({
            next: (updated) => {
                const idx = this.patients.findIndex(p => p.id === updated.id);
                if (idx >= 0) {
                    this.patients[idx] = updated;
                    this.filteredPatients = [...this.patients];
                    if (this.searchTerm) {
                        this.filteredPatients = this.patients.filter(p =>
                            p.nomComplet.toLowerCase().includes(this.searchTerm) ||
                            (p.antecedents && p.antecedents.toLowerCase().includes(this.searchTerm)) ||
                            (p.numeroDeTelephone && p.numeroDeTelephone.includes(this.searchTerm))
                        );
                    }
                }
                console.log('Soignant assigné avec succès:', updated);
            },
            error: (err) => {
                console.error('Erreur assignation soignant:', err);
                alert('Erreur lors de l\'assignation du soignant');
            }
        });
    }

    getSoignantName(patient: Patient): string {
        return patient.soignant?.nom || 'Non assigné';
    }

    // Treatment Management
    hasTreatment(patient: Patient): boolean {
        return !!(patient.treatments && patient.treatments.length > 0);
    }

    openTreatmentDialog(patient: Patient): void {
        this.selectedPatient = patient;
        this.showTreatmentDialog = true;
        // Always fetch treatments from backend
        if (patient.id) {
            this.treatmentService.getByPatient(patient.id).subscribe({
                next: (treatments) => {
                    patient.treatments = (treatments || []).map((t: any) => ({
                        ...t,
                        idTreatment: t.idTreatment ?? t.id
                    }));
                    if (!this.hasTreatment(patient)) {
                        this.resetTreatmentForm();
                    }
                },
                error: () => {
                    if (!this.hasTreatment(patient)) {
                        this.resetTreatmentForm();
                    }
                }
            });
        } else {
            this.resetTreatmentForm();
        }
    }

    closeTreatmentDialog(): void {
        this.showTreatmentDialog = false;
        this.selectedPatient = null;
        this.formErrors = {};
        this.resetTreatmentForm();
    }

    private resetTreatmentForm(): void {
        this.newTreatment = {
            treatmentName: '',
            dosage: '',
            frequency: '',
            startDate: '',
            endDate: '',
            status: 'Active'
        };
    }

    submitTreatment(): void {
        const v = new FormValidator();
        v.required('treatmentName', this.newTreatment.treatmentName, 'Le nom du traitement est requis.');
        v.maxLength('treatmentName', this.newTreatment.treatmentName, 200, 'Le nom ne doit pas dépasser 200 caractères.');
        v.maxLength('dosage', this.newTreatment.dosage, 100, 'Le dosage ne doit pas dépasser 100 caractères.');
        v.maxLength('frequency', this.newTreatment.frequency, 100, 'La fréquence ne doit pas dépasser 100 caractères.');
        v.dateValid('startDate', this.newTreatment.startDate, 'Date de début invalide.');
        v.dateValid('endDate', this.newTreatment.endDate, 'Date de fin invalide.');
        v.dateRange('endDate', this.newTreatment.startDate, this.newTreatment.endDate, 'La date de fin doit être après la date de début.');

        if (!this.selectedPatient) {
            v.custom('treatmentName', true, 'Aucun patient sélectionné.');
        }

        this.formErrors = v.errors;
        if (v.hasErrors()) return;

        const patientId = this.selectedPatient!.id;
        if (!patientId) {
            alert('Patient ID is missing.');
            return;
        }

        const sanitized = sanitizeObject(this.newTreatment);
        const treatmentBody = {
            treatmentName: sanitized.treatmentName,
            dosage: sanitized.dosage || '',
            frequency: sanitized.frequency || '',
            startDate: sanitized.startDate || '',
            endDate: sanitized.endDate || '',
            status: sanitized.status || 'Active',
            patientId: patientId
        };

        this.treatmentService.createFromDTO(treatmentBody).subscribe({
            next: (createdTreatment: any) => {
                console.log('Treatment created:', createdTreatment);
                alert('Treatment added successfully.');
                
                // Update the patient's treatments list
                const patient = this.selectedPatient;
                if (patient) {
                    if (!patient.treatments) {
                        patient.treatments = [];
                    }
                    patient.treatments.push(createdTreatment);
                }
                
                // Close dialog and reset form
                this.closeTreatmentDialog();
                this.loadPatientsFromDatabase();
            },
            error: (err) => {
                console.error('Error creating treatment:', err);
                alert('Error creating treatment.');
            }
        });
    }

    deleteTreatment(patient: Patient, treatment: any): void {
        if (!confirm(`Are you sure you want to delete this treatment?`)) {
            return;
        }

        this.treatmentService.delete(treatment.idTreatment).subscribe({
            next: () => {
                console.log('Treatment deleted successfully');
                this.closeTreatmentDialog();
                this.loadPatientsFromDatabase();
                alert('Treatment deleted successfully.');
            },
            error: (err) => {
                console.error('Error deleting treatment:', err);
                alert('Error deleting treatment.');
            }
        });
    }

    // Medical Record Management
    hasMedicalRecord(patient: Patient): boolean {
        return !!(patient.medicalRecords && patient.medicalRecords.length > 0);
    }

    openMedicalRecordDialog(patient: Patient): void {
        this.selectedPatient = patient;
        this.showMedicalRecordDialog = true;
        // Always fetch medical records from backend
        if (patient.id) {
            this.medicalRecordService.getByPatient(patient.id).subscribe({
                next: (records) => {
                    patient.medicalRecords = records;
                    if (!this.hasMedicalRecord(patient)) {
                        this.resetMedicalRecordForm();
                    }
                },
                error: () => {
                    if (!this.hasMedicalRecord(patient)) {
                        this.resetMedicalRecordForm();
                    }
                }
            });
        } else {
            this.resetMedicalRecordForm();
        }
    }

    closeMedicalRecordDialog(): void {
        this.showMedicalRecordDialog = false;
        this.selectedPatient = null;
        this.formErrors = {};
        this.resetMedicalRecordForm();
    }

    private resetMedicalRecordForm(): void {
        this.newMedicalRecord = {
            diagnosis: '',
            diseaseStage: '',
            medicalHistory: '',
            allergies: ''
        };
    }

    submitMedicalRecord(): void {
        const v = new FormValidator();
        v.required('diagnosis', this.newMedicalRecord.diagnosis, 'Le diagnostic est requis.');
        v.maxLength('diagnosis', this.newMedicalRecord.diagnosis, 300, 'Le diagnostic ne doit pas dépasser 300 caractères.');
        v.maxLength('diseaseStage', this.newMedicalRecord.diseaseStage, 100, 'Le stade ne doit pas dépasser 100 caractères.');
        v.maxLength('medicalHistory', this.newMedicalRecord.medicalHistory, 2000, 'L\'historique ne doit pas dépasser 2000 caractères.');
        v.maxLength('allergies', this.newMedicalRecord.allergies, 500, 'Les allergies ne doivent pas dépasser 500 caractères.');

        if (!this.selectedPatient) {
            v.custom('diagnosis', true, 'Aucun patient sélectionné.');
        }

        this.formErrors = v.errors;
        if (v.hasErrors()) return;

        const patientId = this.selectedPatient!.id;
        if (!patientId) {
            alert('Patient ID is missing.');
            return;
        }

        const sanitized = sanitizeObject(this.newMedicalRecord);
        const recordBody = {
            diagnosis: sanitized.diagnosis,
            diseaseStage: sanitized.diseaseStage || '',
            medicalHistory: sanitized.medicalHistory || '',
            allergies: sanitized.allergies || '',
            patientId: patientId
        };

        this.medicalRecordService.createFromDTO(recordBody).subscribe({
            next: (createdRecord: any) => {
                console.log('Medical record created:', createdRecord);
                alert('Medical record added successfully.');
                
                // Update the patient's medical records list
                const patient = this.selectedPatient;
                if (patient) {
                    if (!patient.medicalRecords) {
                        patient.medicalRecords = [];
                    }
                    patient.medicalRecords.push(createdRecord);
                }
                
                // Close dialog and reset form
                this.closeMedicalRecordDialog();
                this.loadPatientsFromDatabase();
            },
            error: (err) => {
                console.error('Error creating medical record:', err);
                alert('Error creating medical record.');
            }
        });
    }

    deleteMedicalRecord(patient: Patient, record: any): void {
        if (!confirm(`Are you sure you want to delete this medical record?`)) {
            return;
        }

        this.medicalRecordService.delete(record.id).subscribe({
            next: () => {
                console.log('Medical record deleted successfully');
                // Remove from list
                if (patient.medicalRecords) {
                    patient.medicalRecords = patient.medicalRecords.filter(
                        (r: any) => r.idRecord !== record.idRecord
                    );
                }
                alert('Medical record deleted successfully.');
            },
            error: (err) => {
                console.error('Error deleting medical record:', err);
                alert('Error deleting medical record.');
            }
        });
    }

    // Emergency Contact Management
    hasEmergencyContact(patient: Patient): boolean {
        return !!(patient.emergencyContacts && patient.emergencyContacts.length > 0);
    }

    openEmergencyContactDialog(patient: Patient): void {
        this.selectedPatient = patient;
        this.showEmergencyContactDialog = true;
        // Always fetch emergency contacts from backend
        if (patient.id) {
            this.emergencyContactService.getByPatient(patient.id).subscribe({
                next: (contacts) => {
                    patient.emergencyContacts = contacts;
                    if (!this.hasEmergencyContact(patient)) {
                        this.resetEmergencyContactForm();
                    }
                },
                error: () => {
                    if (!this.hasEmergencyContact(patient)) {
                        this.resetEmergencyContactForm();
                    }
                }
            });
        } else {
            this.resetEmergencyContactForm();
        }
    }

    closeEmergencyContactDialog(): void {
        this.showEmergencyContactDialog = false;
        this.selectedPatient = null;
        this.formErrors = {};
        this.resetEmergencyContactForm();
    }

    private resetEmergencyContactForm(): void {
        this.newEmergencyContact = {
            fullName: '',
            relationship: '',
            phone: '',
            email: ''
        };
    }

    submitEmergencyContact(): void {
        const v = new FormValidator();
        v.required('fullName', this.newEmergencyContact.fullName, 'Le nom complet est requis.');
        v.maxLength('fullName', this.newEmergencyContact.fullName, 100, 'Le nom ne doit pas dépasser 100 caractères.');
        v.required('relationship', this.newEmergencyContact.relationship, 'La relation est requise.');
        v.maxLength('relationship', this.newEmergencyContact.relationship, 100, 'La relation ne doit pas dépasser 100 caractères.');
        v.phone('phone', this.newEmergencyContact.phone, 'Numéro de téléphone invalide (8-20 chiffres).');
        v.email('email', this.newEmergencyContact.email, 'Adresse email invalide.');

        if (!this.selectedPatient) {
            v.custom('fullName', true, 'Aucun patient sélectionné.');
        }

        this.formErrors = v.errors;
        if (v.hasErrors()) return;

        const patientId = this.selectedPatient!.id;
        if (!patientId) {
            alert('Patient ID is missing.');
            return;
        }

        const sanitized = sanitizeObject(this.newEmergencyContact);
        const contactBody = {
            fullName: sanitized.fullName,
            relationship: sanitized.relationship || '',
            phone: sanitized.phone || '',
            email: sanitized.email || '',
            patientId: patientId
        };

        this.emergencyContactService.createFromDTO(contactBody).subscribe({
            next: (createdContact: any) => {
                console.log('Emergency contact created:', createdContact);
                alert('Emergency contact added successfully.');
                
                // Update the patient's emergency contacts list
                const patient = this.selectedPatient;
                if (patient) {
                    if (!patient.emergencyContacts) {
                        patient.emergencyContacts = [];
                    }
                    patient.emergencyContacts.push(createdContact);
                }
                
                // Close dialog and reset form
                this.closeEmergencyContactDialog();
                this.loadPatientsFromDatabase();
            },
            error: (err) => {
                console.error('Error creating emergency contact:', err);
                alert('Error creating emergency contact.');
            }
        });
    }

    deleteEmergencyContact(patient: Patient, contact: any): void {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ce contact d'urgence ${contact.fullName} ?`)) {
            return;
        }

        this.emergencyContactService.delete(contact.id).subscribe({
            next: () => {
                console.log('Emergency contact deleted successfully');
                // Reload emergency contacts from backend to ensure UI is in sync
                if (patient.id) {
                    this.emergencyContactService.getByPatient(patient.id).subscribe({
                        next: (contacts) => {
                            patient.emergencyContacts = contacts;
                            alert('Emergency contact deleted successfully.');
                        },
                        error: (err) => {
                            console.error('Error reloading emergency contacts:', err);
                            alert('Emergency contact deleted, but failed to reload contacts.');
                        }
                    });
                } else {
                    alert('Emergency contact deleted successfully.');
                }
            },
            error: (err) => {
                console.error('Error deleting emergency contact:', err);
                alert('Error deleting emergency contact.');
            }
        });
    }

    // ============ REPORT GENERATION ============

    canGenerateReport(patient: Patient): boolean {
        return this.hasTreatment(patient) || this.hasMedicalRecord(patient) || this.hasEmergencyContact(patient);
    }

    openReportDialog(patient: Patient): void {
        this.selectedPatient = patient;
        this.reportGenerating = true;
        this.showReportDialog = true;

        const patientId = patient.id!;

        // Fetch all related data from backend APIs
        forkJoin({
            treatments: this.treatmentService.getByPatient(patientId).pipe(catchError(() => of([]))),
            medicalRecords: this.medicalRecordService.getByPatient(patientId).pipe(catchError(() => of([]))),
            emergencyContacts: this.emergencyContactService.getByPatient(patientId).pipe(catchError(() => of([])))
        }).subscribe({
            next: (result) => {
                // Store fetched data on the patient object
                patient.treatments = (result.treatments || []).map((t: any) => ({
                    ...t,
                    idTreatment: t.idTreatment ?? t.id
                }));
                patient.medicalRecords = result.medicalRecords;
                patient.emergencyContacts = result.emergencyContacts || [];
                this.buildReportPreview(patient);
                this.reportGenerating = false;
            },
            error: (err) => {
                console.error('Error fetching patient data for report:', err);
                this.buildReportPreview(patient);
                this.reportGenerating = false;
            }
        });
    }

    closeReportDialog(): void {
        this.showReportDialog = false;
        this.selectedPatient = null;
        this.generatedReportPreview = null;
        this.reportSaved = false;
    }

    private buildReportPreview(patient: Patient): void {
                const today = new Date().toISOString().slice(0, 10);
                const soignantName = patient.soignant?.nom || 'Non assigné';

                // Gestion des champs potentiellement absents ou de type string/array
                // Utilise uniquement les propriétés existantes sur Patient
                const sexe = (patient as any).gender || 'N/A';
                const antecedents = Array.isArray(patient.antecedents)
                        ? patient.antecedents.join(', ')
                        : (patient.antecedents || 'N/A');
                const symptomes = Array.isArray((patient as any).symptomes)
                        ? (patient as any).symptomes.join(', ')
                        : ((patient as any).symptomes || (patient as any).symptoms || 'N/A');

                // Section dossier médical (medicalRecords)
                let dossierMedicalSection = '';
                if (Array.isArray(patient.medicalRecords) && patient.medicalRecords.length > 0) {
                    dossierMedicalSection = '\n3. Dossier Médical\n' + patient.medicalRecords.map((rec, idx) =>
                        `- [${rec.dateEnregistrement || 'Date inconnue'}] Diagnostic : ${rec.diagnosis || 'N/A'}, Stade : ${rec.diseaseStage || 'N/A'}, Antécédents : ${rec.medicalHistory || 'N/A'}, Allergies : ${rec.allergies || 'N/A'}`
                    ).join('\\n');
                } else {
                    dossierMedicalSection = '\n3. Dossier Médical\n- Aucun dossier médical enregistré';
                }

                // Génération du texte du rapport médical professionnel
                let contenuTexte = `\n1. Informations Générales\n- Nom du patient : ${patient.nomComplet}\n- Date de naissance : ${patient.dateNaissance || 'N/A'}\n- Sexe : ${sexe}\n- Soignant assigné : ${soignantName}\n- Date du rapport : ${today}\n\n2. État de Santé Actuel\n- Antécédents médicaux : ${antecedents}\n- Symptômes observés : ${symptomes}`
                    + dossierMedicalSection +
                    `\n\n4. Traitement en Cours\n${(patient.treatments || []).map(t =>
    `- ${t.treatmentName} : ${t.dosage} (${t.frequency}), du ${t.startDate} au ${t.endDate}, statut : ${t.status}`
).join('\\n') || '- Aucun traitement en cours'}\n\n5. Contacts d’Urgence\n${((patient.emergencyContacts ?? []) as any[]).map(c =>
    `- ${c.nom || c.name} (${c.lien || c.relation || ''}) : ${c.telephone || c.phone || ''} — ${c.adresse || c.address || ''}`
).join('\\n') || '- Aucun contact renseigné'}\n\n6. Recommandations pour le soignant\n- Surveillance quotidienne : observer l’état général, l’appétit, l’hydratation, le comportement.\n- Gestion des urgences : en cas de problème grave, contacter le médecin référent ou le 15.\n- Communication : tenir à jour le carnet de suivi et informer l’équipe médicale de tout changement.\n`;

                const directivesText = Array.isArray(patient.antecedents)
                    ? patient.antecedents.join(', ')
                    : (patient.antecedents || '');
                const recoText = (patient as any).allergies
                    ? `Allergies connues: ${(patient as any).allergies}`
                    : 'Surveillance quotidienne recommandée';

                this.generatedReportPreview = {
                        titre: `Rapport patient — ${patient.nomComplet} (${today})`,
                        patient: patient,
                        soignant: patient.soignant || null,
                        date: today,
                        dateGeneration: new Date().toISOString(),
                        typeRapport: 'HEBDOMADAIRE',
                        statut: 'GENERE',
                        periodeDebut: today,
                        periodeFin: today,
                        contenuTexte: contenuTexte,
                        directives: directivesText || undefined,
                        recommandations: recoText || undefined,
                        formatExport: 'PDF',
                        tauxObservance: null,
                        qualiteSommeil: null,
                        nbAlertes: null,
                        nbInterventions: null,
                        nbComportementsAnormaux: null,
                        hasTreatment: this.hasTreatment(patient),
                        hasMedicalRecord: this.hasMedicalRecord(patient),
                        hasEmergencyContact: this.hasEmergencyContact(patient)
                };
    }

    submitReport(): void {
        if (!this.selectedPatient || !this.generatedReportPreview) return;

        const preview = this.generatedReportPreview;
        const rapport: Rapport = {
            patient: { id: this.selectedPatient.id },
            soignant: this.selectedPatient.soignant?.id ? { id: this.selectedPatient.soignant.id } : null,
            typeRapport: preview.typeRapport || 'HEBDOMADAIRE',
            periodeDebut: preview.periodeDebut,
            periodeFin: preview.periodeFin,
            titre: preview.titre,
            contenuTexte: preview.contenuTexte,
            directives: preview.directives || null,
            recommandations: preview.recommandations || null,
            formatExport: 'PDF',
            statut: 'GENERE'
        };

        this.reportGenerating = true;
        this.rapportService.create(rapport).subscribe({
            next: (created) => {
                this.reportGenerating = false;
                console.log('Rapport créé:', created);
                // Update preview with saved data (id, dateGeneration, etc.)
                this.generatedReportPreview = {
                    ...this.generatedReportPreview,
                    ...created,
                    patient: this.generatedReportPreview.patient,
                    soignant: created.soignant || this.generatedReportPreview.soignant
                };
                this.reportSaved = true;
                alert(`Rapport enregistré avec succès pour ${this.selectedPatient?.nomComplet}. Il est maintenant visible dans la page Rapports Médicaux.`);
            },
            error: (err) => {
                this.reportGenerating = false;
                console.error('Erreur création rapport:', err);
                alert('Erreur lors de la sauvegarde du rapport.');
            }
        });
    }

    // Retourne le label du type de rapport
    getTypeLabel(type: string): string {
        switch (type) {
            case 'HEBDOMADAIRE': return 'DOCTOR_REPORTS.TYPE_WEEKLY';
            case 'MENSUEL': return 'DOCTOR_REPORTS.TYPE_MONTHLY';
            case 'QUOTIDIEN': return 'DOCTOR_REPORTS.TYPE_DAILY';
            case 'INCIDENT': return 'DOCTOR_REPORTS.TYPE_INCIDENT';
            default: return type || '—';
        }
    }

    // Retourne le label du statut du rapport
    getStatutLabel(statut: string): string {
        switch (statut) {
            case 'GENERE': return 'DOCTOR_REPORTS.STATUS_GENERATED';
            case 'ENVOYE': return 'DOCTOR_REPORTS.STATUS_SENT';
            case 'ARCHIVE': return 'DOCTOR_REPORTS.STATUS_ARCHIVED';
            default: return statut || '—';
        }
    }

    // Vérifie la présence d'indicateurs cliniques
    hasIndicators(rapport: any): boolean {
        if (!rapport) return false;
        return (
            rapport.tauxObservance != null ||
            rapport.qualiteSommeil != null ||
            rapport.nbAlertes != null ||
            rapport.nbInterventions != null ||
            rapport.nbComportementsAnormaux != null
        );
    }

    // Téléchargement du rapport
    downloadReport(id: number): void {
        window.open('/api/rapports/' + id + '/download', '_blank');
    }
}
