import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../auth/auth.service';
import { User, UserRole } from '../models/user.model';
import { PatientService, Patient } from '../services/patient.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.css'
})
export class DoctorDashboardComponent implements OnInit {
  currentUser: User | null = null;
  UserRole = UserRole;

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

  todayDateLabel: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private patientService: PatientService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.todayDateLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Charger les patients depuis l'API
    this.loadPatients();
  }

  loadPatients(): void {
    this.patientService.getAll().subscribe({
      next: (patients) => {
        this.recentPatients = patients.slice(0, 5); // 5 derniers patients
        this.medicalStats.totalPatients = patients.length;
      },
      error: (err) => {
        console.error('Erreur chargement patients:', err);
      }
    });
  }

  getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrateur';
      case UserRole.AIDANT:
        return 'Aidant';
      case UserRole.SOIGNANT:
        return 'Docteur';
      case UserRole.PATIENT:
        return 'Patient';
      default:
        return 'Inconnu';
    }
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Actions médicales
  createMedicalReport(patientId: number): void {
    console.log('Create medical report for patient:', patientId);
    // Ouvrir le formulaire de rapport médical
  }

  scheduleAppointment(patientId: number): void {
    console.log('Schedule appointment for patient:', patientId);
    // Ouvrir le calendrier de prise de RDV
  }

  prescribeMedication(patientId: number): void {
    console.log('Prescribe medication for patient:', patientId);
    // Ouvrir le formulaire de prescription
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
}
