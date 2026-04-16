import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';

@Component({
    selector: 'app-patient-dashboard',
    standalone: true,
    imports: [CommonModule, SidebarComponent],
    templateUrl: './patient-dashboard.component.html',
    styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent {

    currentDate: Date = new Date();

    patientName: string = "Jean Dupont";

    medications = [
        { name: 'Lisinopril', time: '08:00', dose: '10mg', taken: true, type: 'pill' },
        { name: 'Atorvastatine', time: '08:00', dose: '20mg', taken: true, type: 'pill' },
        { name: 'Metformine', time: '13:00', dose: '500mg', taken: false, type: 'pill' },
        { name: 'Aspirine', time: '20:00', dose: '81mg', taken: false, type: 'pill' }
    ];

    nextAppointment = {
        doctor: 'Dr. Martin',
        specialty: 'Cardiologue',
        date: 'Demain',
        time: '14:30',
        location: 'Cabinet Medical Central'
    };

    vitals = {
        heartRate: 72,
        bloodPressure: '120/80',
        weight: '78 kg'
    };

    constructor(private router: Router) {
        console.log('Patient Dashboard Initialized');
    }

    triggerSOS(): void {
        alert("ALERTE URGENCE ENVOYÉE AUX SECOURS ET AU MÉDECIN !");
    }

    contactDoctor(): void {
        alert("Ouverture de la messagerie avec Dr. Martin...");
    }

    logout(): void {
        this.router.navigate(['/test']);
    }
}
