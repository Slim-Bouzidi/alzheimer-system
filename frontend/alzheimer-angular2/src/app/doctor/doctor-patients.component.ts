import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { PatientService, Patient } from '../services/patient.service';
import { UserService, User } from '../services/user.service';
import { EmergencyContactService } from '../services/emergency-contact.service';
import { MedicalRecordService } from '../services/medical-record.service';
import { TreatmentService } from '../services/treatment.service';
import { TranslateFallbackPipe } from '../shared/pipes/translate-fallback.pipe';

@Component({
    selector: 'app-doctor-patients',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent, TranslateFallbackPipe],
    templateUrl: './doctor-patients.component.html',
    styleUrls: ['./doctor-patients.component.css']
})
export class DoctorPatientsComponent implements OnInit {

    patients: Patient[] = [];
    filteredPatients: Patient[] = [];
    soignants: User[] = [];
    searchTerm: string = '';
    isLoading: boolean = false;
    error: string = '';
    currentSort: string = 'default';

    // Dialog display state
    showAddPatientDialog: boolean = false;
    showEmergencyContactDialog: boolean = false;
    showMedicalRecordDialog: boolean = false;
    showTreatmentDialog: boolean = false;
    selectedPatient: Patient | null = null;

    // Modèle pour le nouveau patient (côté front, mappé sur l'entité Spring)
    newPatient: any = {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'Male',
        phone: '',
        address: '',
        familyHistoryAlzheimer: false,
        status: 'stable'
    };

    // Modèle pour le nouveau contact d'urgence
    newEmergencyContact: any = {
        fullName: '',
        relationship: '',
        phone: '',
        email: ''
    };

    // État d'édition pour le contact d'urgence
    editingContactId: number | null = null;
    editContactModel: any = {};

    // Modèle pour le nouveau dossier médical
    newMedicalRecord: any = {
        diagnosis: '',
        diseaseStage: '',
        medicalHistory: '',
        allergies: ''
    };

    // État d'édition pour le dossier médical
    editingRecordId: number | null = null;
    editMedicalRecordModel: any = {};

    // Modèle pour le nouveau traitement
    newTreatment: any = {
        treatmentName: '',
        dosage: '',
        frequency: '',
        startDate: '',
        endDate: '',
        status: 'Active'
    };

    // État d'édition pour le traitement
    editingTreatmentId: number | null = null;
    editTreatmentModel: any = {};

    constructor(
        private router: Router,
        private patientService: PatientService,
        private userService: UserService,
        private emergencyContactService: EmergencyContactService,
        private medicalRecordService: MedicalRecordService,
        private treatmentService: TreatmentService
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

        const requestObservable = this.currentSort === 'status'
            ? this.patientService.getPatientsSortedByStatus()
            : this.patientService.getAll();

        requestObservable.subscribe({
            next: (data) => {
                this.mapPatientsData(data);
                this.isLoading = false;
            },
            error: (err) => {
                this.error = 'Erreur de connexion à la base de données: ' + err.message;
                this.isLoading = false;
                console.error('Erreur de connexion au backend Spring Boot:', err);
                this.loadMockData();
            }
        });
    }

    // Extraction de la logique de mapping pour réutilisation
    private mapPatientsData(data: any): void {
        this.patients = (data as any[]).map((p: any) => ({
            // identifiants
            id: p.idPatient ?? p.id,
            idPatient: p.idPatient ?? p.id,
            // noms
            nom: p.lastName,
            prenom: p.firstName,
            nomComplet: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
            // champs d'affichage demandés
            dateNaissance: p.dateOfBirth,
            numeroDeTelephone: p.phone,
            gender: p.gender,
            status: p.status,
            // AI Risk Scoring
            riskScore: p.riskScore,
            riskLevel: p.riskLevel,
            // Manquants mapping
            familyHistoryAlzheimer: p.familyHistoryAlzheimer,
            adresse: p.address,
            // Relations
            medicalRecords: p.medicalRecords || [],
            emergencyContacts: p.emergencyContacts || [],
            treatments: p.treatments || [],
            // actif / inactif dérivé du statut backend
            actif: (p.status ?? '').toLowerCase() !== 'inactive',
            soignant: p.soignantId ? { id: p.soignantId } : undefined
        }));
        this.filteredPatients = [...this.patients];

        // Réappliquer le filtre de recherche si existant
        if (this.searchTerm) {
            this.applySearchFilter();
        }
    }

    // Données mock temporaires (à remplacer par le backend)
    private loadMockData(): void {
        console.log('Chargement des données mock en attente du backend Spring Boot...');
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
        this.filteredPatients = [...this.patients];
        console.log('Données mock chargées. Patients disponibles:', this.patients.length);
    }

    filterPatients(event: any): void {
        this.searchTerm = event.target.value.toLowerCase();
        this.applySearchFilter();
    }

    private applySearchFilter(): void {
        if (!this.searchTerm) {
            this.filteredPatients = [...this.patients];
            return;
        }
        this.filteredPatients = this.patients.filter(p =>
            (p.nomComplet ?? '').toLowerCase().includes(this.searchTerm) ||
            (p.antecedents && p.antecedents.toLowerCase().includes(this.searchTerm)) ||
            (p.numeroDeTelephone && p.numeroDeTelephone.includes(this.searchTerm))
        );
    }

    onSortChange(event: any): void {
        this.currentSort = event.target.value; // 'default' ou 'status'
        this.loadPatientsFromDatabase(); // Recharge et refiltre si besoin
    }

    getPatientInitials(patient: Patient): string {
        const prenom = patient.prenom || patient.nomComplet?.split(' ')[0] || '?';
        const nom = patient.nom || patient.nomComplet?.split(' ').slice(-1)[0] || '?';
        return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
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
            idPatient: patient.id,
            firstName: patient.prenom,
            lastName: patient.nom,
            dateOfBirth: patient.dateNaissance,
            gender: patient.gender,
            phone: patient.numeroDeTelephone,
            address: patient.adresse || '',
            familyHistoryAlzheimer: patient.familyHistoryAlzheimer || false,
            status: newStatus,
            soignantId: patient.soignant?.id || null,
            nomComplet: patient.nomComplet,
            medicalRecords: patient.medicalRecords,
            emergencyContacts: patient.emergencyContacts,
            treatments: patient.treatments
        };

        this.patientService.update(patient.id, updatedPatient).subscribe({
            next: (response: any) => {
                console.log('Statut du patient mis à jour:', response);
                patient.status = newStatus;
                patient.riskScore = response.riskScore;
                patient.riskLevel = response.riskLevel;
                patient.showStatusDropdown = false;
                alert(`Statut de ${patient.nomComplet} mis à jour vers ${newStatus}`);
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
        this.router.navigate(['/test']);
    }

    exportTreatmentsPdf(patient: Patient): void {
        const patientId = patient.id || patient.idPatient;
        if (!patientId) return;

        this.patientService.downloadTreatmentsPdf(patientId).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Treatments_${patient.nomComplet || 'Patient'}_${patientId}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            error: (err) => {
                console.error('Error downloading PDF', err);
                alert('An error occurred while generating the PDF.');
            }
        });
    }

    // Opens/closes the add patient dialog
    addPatient(): void {
        this.showAddPatientDialog = !this.showAddPatientDialog;
        if (!this.showAddPatientDialog) {
            this.resetPatientForm();
        }
    }

    // Reset the patient form to initial state
    private resetPatientForm(): void {
        this.newPatient = {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            gender: 'Male',
            phone: '',
            address: '',
            familyHistoryAlzheimer: false,
            status: 'stable'
        };
    }

    // Submit form to create a new patient
    submitNewPatient(): void {
        if (!this.newPatient.firstName || !this.newPatient.lastName) {
            alert('Please enter at least first name and last name.');
            return;
        }

        const patientBody = {
            firstName: this.newPatient.firstName,
            lastName: this.newPatient.lastName,
            dateOfBirth: this.newPatient.dateOfBirth || null,
            gender: this.newPatient.gender || 'Male',
            phone: this.newPatient.phone || null,
            address: this.newPatient.address || null,
            familyHistoryAlzheimer: !!this.newPatient.familyHistoryAlzheimer,
            status: this.newPatient.status || 'active',
            soignantId: 1  // Always 1 as specified
        };

        this.isLoading = true;

        this.patientService.create(patientBody).subscribe({
            next: (createdPatient: any) => {
                console.log('Patient created:', createdPatient);
                alert('Patient added successfully.');
                this.isLoading = false;

                // Close dialog and reset form
                this.showAddPatientDialog = false;
                this.resetPatientForm();

                // Reload patients list
                this.loadPatientsFromDatabase();
            },
            error: (err) => {
                console.error('Error creating patient:', err);
                this.isLoading = false;
                alert('Error creating patient.');
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
                            (p.nomComplet ?? '').toLowerCase().includes(this.searchTerm) ||
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
        if (!this.hasTreatment(patient)) {
            this.resetTreatmentForm();
        }
    }

    closeTreatmentDialog(): void {
        this.showTreatmentDialog = false;
        this.selectedPatient = null;
        this.editingTreatmentId = null;
        this.editTreatmentModel = {};
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
        if (!this.selectedPatient || !this.newTreatment.treatmentName) {
            alert('Please enter at least the treatment name.');
            return;
        }

        const patientId = this.selectedPatient.id || this.selectedPatient.idPatient;
        if (!patientId) {
            alert('Patient ID is missing.');
            return;
        }

        const treatmentBody = {
            treatmentName: this.newTreatment.treatmentName,
            dosage: this.newTreatment.dosage || '',
            frequency: this.newTreatment.frequency || '',
            startDate: this.newTreatment.startDate || '',
            endDate: this.newTreatment.endDate || '',
            status: this.newTreatment.status || 'Active',
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
                // Remove from list
                if (patient.treatments) {
                    patient.treatments = patient.treatments.filter(
                        (t: any) => t.idTreatment !== treatment.idTreatment
                    );
                }
                alert('Treatment deleted successfully.');
            },
            error: (err) => {
                console.error('Error deleting treatment:', err);
                alert('Error deleting treatment.');
            }
        });
    }

    startEditTreatment(treatment: any): void {
        this.editingTreatmentId = treatment.idTreatment;
        this.editTreatmentModel = { ...treatment };
    }

    cancelEditTreatment(): void {
        this.editingTreatmentId = null;
        this.editTreatmentModel = {};
    }

    saveEditTreatment(patient: Patient): void {
        if (!this.editTreatmentModel.treatmentName) {
            alert('Please enter at least the treatment name.');
            return;
        }

        const patientId = patient.id || patient.idPatient;
        if (!patientId) {
            alert('Patient ID is missing.');
            return;
        }

        const updateBody = {
            ...this.editTreatmentModel,
            patient: { idPatient: patientId }
        };

        this.treatmentService.update(updateBody).subscribe({
            next: (updatedTreatment: any) => {
                console.log('Treatment updated:', updatedTreatment);
                if (patient.treatments) {
                    const index = patient.treatments.findIndex((t: any) => t.idTreatment === updatedTreatment.idTreatment);
                    if (index !== -1) {
                        patient.treatments[index] = { ...patient.treatments[index], ...updatedTreatment };
                    }
                }
                alert('Treatment updated successfully.');
                this.editingTreatmentId = null;
            },
            error: (err) => {
                console.error('Error updating treatment:', err);
                alert('Error updating treatment.');
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
        if (!this.hasMedicalRecord(patient)) {
            this.resetMedicalRecordForm();
        }
    }

    closeMedicalRecordDialog(): void {
        this.showMedicalRecordDialog = false;
        this.selectedPatient = null;
        this.editingRecordId = null;
        this.editMedicalRecordModel = {};
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
        if (!this.selectedPatient || !this.newMedicalRecord.diagnosis) {
            alert('Please enter at least the diagnosis.');
            return;
        }

        const patientId = this.selectedPatient.id || this.selectedPatient.idPatient;
        if (!patientId) {
            alert('Patient ID is missing.');
            return;
        }

        const recordBody = {
            diagnosis: this.newMedicalRecord.diagnosis,
            diseaseStage: this.newMedicalRecord.diseaseStage || '',
            medicalHistory: this.newMedicalRecord.medicalHistory || '',
            allergies: this.newMedicalRecord.allergies || '',
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

        this.medicalRecordService.delete(record.idRecord).subscribe({
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

    startEditMedicalRecord(record: any): void {
        this.editingRecordId = record.idRecord;
        // Créer une copie pour ne pas modifier l'original tant qu'on a pas sauvegardé
        this.editMedicalRecordModel = { ...record };
    }

    cancelEditMedicalRecord(): void {
        this.editingRecordId = null;
        this.editMedicalRecordModel = {};
    }

    saveEditMedicalRecord(patient: Patient): void {
        if (!this.editMedicalRecordModel.diagnosis) {
            alert('Please enter at least the diagnosis.');
            return;
        }

        const patientId = patient.id || patient.idPatient;
        if (!patientId) {
            alert('Patient ID is missing.');
            return;
        }

        // Préparer l'objet complet avec l'ID patient pour le backend
        const updateBody = {
            ...this.editMedicalRecordModel,
            patient: { idPatient: patientId }
        };

        this.medicalRecordService.update(updateBody).subscribe({
            next: (updatedRecord: any) => {
                console.log('Medical record updated:', updatedRecord);

                // Mettre à jour la ligne dans le tableau front
                if (patient.medicalRecords) {
                    const index = patient.medicalRecords.findIndex((r: any) => r.idRecord === updatedRecord.idRecord);
                    if (index !== -1) {
                        // Conserver les dates éventuellement formatées, etc.
                        patient.medicalRecords[index] = { ...patient.medicalRecords[index], ...updatedRecord };
                    }
                }

                alert('Medical record updated successfully.');
                this.editingRecordId = null;
            },
            error: (err) => {
                console.error('Error updating medical record:', err);
                alert('Error updating medical record.');
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
        if (!this.hasEmergencyContact(patient)) {
            this.resetEmergencyContactForm();
        }
    }

    closeEmergencyContactDialog(): void {
        this.showEmergencyContactDialog = false;
        this.selectedPatient = null;
        this.editingContactId = null;
        this.editContactModel = {};
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
        if (!this.selectedPatient || !this.newEmergencyContact.fullName) {
            alert('Please enter at least the contact full name.');
            return;
        }

        const patientId = this.selectedPatient.id || this.selectedPatient.idPatient;
        if (!patientId) {
            alert('Patient ID is missing.');
            return;
        }

        const contactBody = {
            fullName: this.newEmergencyContact.fullName,
            relationship: this.newEmergencyContact.relationship || '',
            phone: this.newEmergencyContact.phone || '',
            email: this.newEmergencyContact.email || '',
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

        this.emergencyContactService.delete(contact.idContact).subscribe({
            next: () => {
                console.log('Emergency contact deleted successfully');
                // Remove from list
                if (patient.emergencyContacts) {
                    patient.emergencyContacts = patient.emergencyContacts.filter(
                        (c: any) => c.idContact !== contact.idContact
                    );
                }
                alert('Emergency contact deleted successfully.');
            },
            error: (err) => {
                console.error('Error deleting emergency contact:', err);
                alert('Error deleting emergency contact.');
            }
        });
    }

    startEditEmergencyContact(contact: any): void {
        this.editingContactId = contact.idContact;
        this.editContactModel = { ...contact };
    }

    cancelEditEmergencyContact(): void {
        this.editingContactId = null;
        this.editContactModel = {};
    }

    saveEditEmergencyContact(patient: Patient): void {
        if (!this.editContactModel.fullName) {
            alert('Please enter at least the contact full name.');
            return;
        }

        const patientId = patient.id || patient.idPatient;
        if (!patientId) {
            alert('Patient ID is missing.');
            return;
        }

        const updateBody = {
            ...this.editContactModel,
            patient: { idPatient: patientId }
        };

        this.emergencyContactService.update(updateBody).subscribe({
            next: (updatedContact: any) => {
                console.log('Emergency contact updated:', updatedContact);
                if (patient.emergencyContacts) {
                    const index = patient.emergencyContacts.findIndex((c: any) => c.idContact === updatedContact.idContact);
                    if (index !== -1) {
                        patient.emergencyContacts[index] = { ...patient.emergencyContacts[index], ...updatedContact };
                    }
                }
                alert('Emergency contact updated successfully.');
                this.editingContactId = null;
            },
            error: (err) => {
                console.error('Error updating emergency contact:', err);
                alert('Error updating emergency contact.');
            }
        });
    }
}
