import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/sidebar-portal/sidebar.component';

interface DoctorAlertItem {
  level: 'critical' | 'warning' | 'info';
  patient: string;
  message: string;
  time: string;
  recommendation: string;
}

@Component({
  selector: 'app-doctor-alerts',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './doctor-alerts.component.html',
  styleUrl: './doctor-alerts.component.css',
})
export class DoctorAlertsComponent {
  readonly alerts: DoctorAlertItem[] = [
    {
      level: 'critical',
      patient: 'Marie Dupont',
      message: 'Rapid cognitive decline detected',
      time: '08:30',
      recommendation: 'Review the patient timeline and update the care plan.',
    },
    {
      level: 'warning',
      patient: 'Jean Martin',
      message: 'Medication non-adherence reported',
      time: '07:45',
      recommendation: 'Check treatment adherence and contact the caregiver.',
    },
    {
      level: 'info',
      patient: 'Alice Bernard',
      message: 'New lab results available',
      time: '06:00',
      recommendation: 'Open the patient file and review the latest results.',
    },
  ];

  constructor(private router: Router) {}

  goToPatients(): void {
    this.router.navigate(['/doctor-patients']);
  }

  goToReports(): void {
    this.router.navigate(['/doctor-reports']);
  }
}
