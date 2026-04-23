import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SoignantService } from '../soignant/soignant.service';
import { User } from '../models/user.model';
import { PatientService, Patient } from '../services/patient.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-doctor-dashboard-simple',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './doctor-dashboard-simple.component.html',
  styleUrls: ['./doctor-dashboard-simple.component.css']
})
export class DoctorDashboardSimpleComponent implements OnInit {
  currentDate = new Date();
  availableCaregivers: User[] = [];

  // Chart Data (Mock)
  activityChart = [
    { label: 'Mon', value: 65, height: '65%' },
    { label: 'Tue', value: 45, height: '45%' },
    { label: 'Wed', value: 85, height: '85%' },
    { label: 'Thu', value: 55, height: '55%' },
    { label: 'Fri', value: 75, height: '75%' },
    { label: 'Sat', value: 35, height: '35%' },
    { label: 'Sun', value: 20, height: '20%' }
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
      type: 'Follow-up consultation',
      status: 'confirmed'
    },
    {
      id: 2,
      patientName: 'Jean Martin',
      time: '10:30',
      type: 'Cognitive assessment',
      status: 'confirmed'
    },
    {
      id: 3,
      patientName: 'Alice Bernard',
      time: '14:00',
      type: 'Re-evaluation',
      status: 'pending'
    }
  ];

  // Alertes médicales
  medicalAlerts = [
    {
      id: 1,
      type: 'urgent',
      message: 'Rapid cognitive decline detected for Marie Dupont.',
      time: '08:30',
      patientId: 1
    },
    {
      id: 2,
      type: 'warning',
      message: 'Medication adherence issue reported for Jean Martin.',
      time: '07:45',
      patientId: 2
    },
    {
      id: 3,
      type: 'info',
      message: 'A new follow-up report is available for Alice Bernard.',
      time: '06:00',
      patientId: 3
    }
  ];

  constructor(
    private router: Router,
    private soignantService: SoignantService,
    private patientService: PatientService,
    private authService: AuthService
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
  }

  scheduleAppointment(patientId: number): void {
  }

  onAssignSoignant(patientId: any, soignantId: string): void {
    if (!soignantId) return;
    this.soignantService.assignerPatient(patientId.toString(), soignantId).subscribe(() => {
      alert('Patient assigned successfully.');
    });
  }

  onSendInstructions(patientId: any): void {
    const instruction = window.prompt('Enter medical instructions for this patient:');
    if (instruction) {
      this.soignantService.envoyerInstructionMedicale(patientId.toString(), instruction).subscribe(() => {
        alert('Instructions sent to the caregiver.');
      });
    }
  }

  prescribeMedication(patientId: number): void {
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

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
