import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../services/auth.service';

type AlertLevel = 'urgent' | 'warning' | 'info';

interface DoctorAlert {
  id: number;
  level: AlertLevel;
  patientName: string;
  message: string;
  action: string;
  timeLabel: string;
  reviewed: boolean;
}

@Component({
  selector: 'app-doctor-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './doctor-alerts.component.html',
  styleUrls: ['./doctor-alerts.component.css']
})
export class DoctorAlertsComponent {
  searchQuery = '';
  activeFilter: 'all' | AlertLevel = 'all';

  alerts: DoctorAlert[] = [
    {
      id: 1,
      level: 'urgent',
      patientName: 'Marie Dupont',
      message: 'Rapid cognitive decline observed during the morning visit.',
      action: 'Schedule a neurology consultation within the next 24 hours.',
      timeLabel: '08:30',
      reviewed: false,
    },
    {
      id: 2,
      level: 'warning',
      patientName: 'Jean Martin',
      message: 'Two medication doses were missed this week.',
      action: 'Review adherence and adjust the caregiver reminder workflow.',
      timeLabel: '07:45',
      reviewed: false,
    },
    {
      id: 3,
      level: 'info',
      patientName: 'Alice Bernard',
      message: 'A new weekly follow-up report has been received.',
      action: 'Review the report and add directives if needed.',
      timeLabel: '06:00',
      reviewed: true,
    },
    {
      id: 4,
      level: 'warning',
      patientName: 'Paul Durand',
      message: 'An increase in wandering episodes was reported by the caregiver.',
      action: 'Reassess the patient risk level and care plan.',
      timeLabel: 'Yesterday',
      reviewed: false,
    },
  ];

  constructor(private router: Router, private authService: AuthService) {}

  get filteredAlerts(): DoctorAlert[] {
    const normalizedQuery = this.searchQuery.trim().toLowerCase();

    return this.alerts.filter((alert) => {
      const matchesFilter = this.activeFilter === 'all' || alert.level === this.activeFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        alert.patientName.toLowerCase().includes(normalizedQuery) ||
        alert.message.toLowerCase().includes(normalizedQuery) ||
        alert.action.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }

  get activeAlertsCount(): number {
    return this.alerts.filter((alert) => !alert.reviewed).length;
  }

  get urgentAlertsCount(): number {
    return this.alerts.filter((alert) => alert.level === 'urgent' && !alert.reviewed).length;
  }

  get followUpCount(): number {
    return this.alerts.filter((alert) => alert.level !== 'info' && !alert.reviewed).length;
  }

  setFilter(filter: 'all' | AlertLevel): void {
    this.activeFilter = filter;
  }

  markReviewed(alert: DoctorAlert): void {
    alert.reviewed = true;
  }

  getLevelClass(level: AlertLevel): string {
    return `alert-${level}`;
  }

  getLevelLabel(level: AlertLevel): string {
    switch (level) {
      case 'urgent':
        return 'DOCTOR.ALERT_URGENT';
      case 'warning':
        return 'DOCTOR.ALERT_WARNING';
      default:
        return 'DOCTOR.ALERT_INFO';
    }
  }

  openPatientFile(): void {
    this.router.navigate(['/doctor-patients']);
  }

  openReports(): void {
    this.router.navigate(['/doctor-reports']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}