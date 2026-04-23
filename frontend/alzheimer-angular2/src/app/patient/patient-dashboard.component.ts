import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-patient-dashboard',
    standalone: true,
    imports: [CommonModule, SidebarComponent],
    templateUrl: './patient-dashboard.component.html',
    styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent {

    currentDate: Date = new Date();

    medications = [
        { name: 'Memantine', time: '08:00', dose: '10 mg', taken: true, helper: 'Après le petit-déjeuner' },
        { name: 'Donepezil', time: '13:00', dose: '5 mg', taken: false, helper: 'Avec un verre d’eau' },
        { name: 'Vitamine D', time: '20:00', dose: '1000 UI', taken: false, helper: 'Avec le dîner' }
    ];

    nextAppointment = {
        doctor: 'Dr. Martin',
        specialty: 'Neurologie',
        date: '24 avril',
        time: '14:30',
        location: 'Cabinet médical central',
        note: 'Prévoir les derniers résultats et venir 15 minutes en avance.'
    };

    careHighlights = [
        { label: 'Traitements pris', value: '1 / 3', tone: 'success', icon: 'pi-check-circle' },
        { label: 'Activité cognitive', value: '20 min', tone: 'info', icon: 'pi-bolt' },
        { label: 'Contacts disponibles', value: '3', tone: 'neutral', icon: 'pi-users' }
    ];

    wellnessCards = [
        { label: 'Sommeil', value: '7h 40', note: 'nuit stable', icon: 'pi-moon' },
        { label: 'Hydratation', value: '1.6 L', note: 'objectif presque atteint', icon: 'pi-globe' },
        { label: 'Humeur', value: 'Calme', note: 'aucun signal de stress', icon: 'pi-heart-fill' }
    ];

    quickActions = [
        { label: 'Voir mes rendez-vous', route: '/patient-appointments', icon: 'pi-calendar' },
        { label: 'Consulter mes exercices', route: '/patient-exercises', icon: 'pi-bolt' },
        { label: 'Espace urgence', route: '/patient-emergency', icon: 'pi-bell' }
    ];

    constructor(private router: Router, private authService: AuthService) {
    }

    get patientName(): string {
        return this.authService.getDisplayName(false);
    }

    get completedMedications(): number {
        return this.medications.filter((med) => med.taken).length;
    }

    triggerSOS(): void {
        alert("ALERTE URGENCE ENVOYÉE AUX SECOURS ET AU MÉDECIN !");
    }

    contactDoctor(): void {
        alert("Ouverture de la messagerie avec Dr. Martin...");
    }

    openRoute(route: string): void {
        void this.router.navigateByUrl(route);
    }

    async logout(): Promise<void> {
        await this.authService.logout();
    }
}
