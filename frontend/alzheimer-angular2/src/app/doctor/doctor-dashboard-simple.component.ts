import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { TranslateModule } from '@ngx-translate/core';
import { SoignantService } from '../soignant/soignant.service';
import { User } from '../models/user.model';
import { PatientService, Patient } from '../services/patient.service';

@Component({
  selector: 'app-doctor-dashboard-simple',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TranslateModule],
  templateUrl: './doctor-dashboard-simple.component.html',
  styleUrls: ['./doctor-dashboard-simple.component.css']
})
export class DoctorDashboardSimpleComponent implements OnInit {
  currentDate = new Date();
  availableCaregivers: User[] = [];

  // Chart Data (Mock)
  activityChart = [
    { label: 'Lun', value: 65, height: '65%' },
    { label: 'Mar', value: 45, height: '45%' },
    { label: 'Mer', value: 85, height: '85%' },
    { label: 'Jeu', value: 55, height: '55%' },
    { label: 'Ven', value: 75, height: '75%' },
    { label: 'Sam', value: 35, height: '35%' },
    { label: 'Dim', value: 20, height: '20%' }
  ];

  demographicsChart = [
    { label: '60-70', value: 30, color: 'var(--primary-color)', width: '30%' },
    { label: '70-80', value: 45, color: 'var(--warning-color)', width: '45%' },
    { label: '80+', value: 25, color: 'var(--danger-color)', width: '25%' }
  ];

  // Statistiques médicales
  medicalStats = {
    totalPatients: 0,
    upcomingAppointments: 8,
    pendingReports: 5,
    medicationAdherence: 85.2
  };

  // Liste des patients récents (chargés depuis l'API)
  recentPatients: Patient[] = [];

  // Rendez-vous du jour
  todayAppointments = [
    {
      id: 1,
      patientName: 'Marie Dupont',
      time: '09:00',
      type: 'Consultation de suivi',
      status: 'confirmed'
    },
    {
      id: 2,
      patientName: 'Jean Martin',
      time: '10:30',
      type: 'Test cognitif',
      status: 'confirmed'
    },
    {
      id: 3,
      patientName: 'Alice Bernard',
      time: '14:00',
      type: 'Réévaluation',
      status: 'pending'
    }
  ];

  // Alertes médicales
  medicalAlerts = [
    {
      id: 1,
      type: 'urgent',
      message: 'Dégradation cognitive rapide - Marie Dupont',
      time: '08:30',
      patientId: 1
    },
    {
      id: 2,
      type: 'warning',
      message: 'Non-adhérence médicamenteuse - Jean Martin',
      time: '07:45',
      patientId: 2
    },
    {
      id: 3,
      type: 'info',
      message: 'Nouveau rapport disponible - Alice Bernard',
      time: '06:00',
      patientId: 3
    }
  ];

  constructor(
    private router: Router,
    private soignantService: SoignantService,
    private patientService: PatientService
  ) { }

  ngOnInit(): void {
    this.soignantService.getSoignantsDisponibles().subscribe(users => {
      this.availableCaregivers = users;
    });

    // Charger les patients depuis l'API
    this.patientService.getAll().subscribe({
      next: (patients) => {
        this.recentPatients = patients.slice(0, 5);
        this.medicalStats.totalPatients = patients.length;
      },
      error: (err) => console.error('Erreur chargement patients:', err)
    });
  }

  // Actions médicales
  createMedicalReport(patientId: number): void {
    console.log('Create medical report for patient:', patientId);
  }

  scheduleAppointment(patientId: number): void {
    console.log('Schedule appointment for patient:', patientId);
  }

  onAssignSoignant(patientId: any, soignantId: string): void {
    if (!soignantId) return;
    this.soignantService.assignerPatient(patientId.toString(), soignantId).subscribe(() => {
      alert('Patient assigné avec succès !');
    });
  }

  onSendInstructions(patientId: any): void {
    const instruction = window.prompt('Entrez vos instructions médicales pour ce patient :');
    if (instruction) {
      this.soignantService.envoyerInstructionMedicale(patientId.toString(), instruction).subscribe(() => {
        alert('Instructions envoyées au soignant !');
      });
    }
  }

  prescribeMedication(patientId: number): void {
    console.log('Prescribe medication for patient:', patientId);
  }


  getAlertTypeColor(type: string): string {
    switch (type) {
      case 'urgent':
        return '#dc3545';
      case 'warning':
        return '#ffc107';
      case 'info':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'urgent':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  logout(): void {
    this.router.navigate(['/test']);
  }
}
