import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/alzheimer-app/auth.service';
import { PatientService, Patient } from '../../../core/services/alzheimer-app/patient.service';
import { SidebarComponent as SidebarPortalComponent } from '../../../shared/sidebar-portal/sidebar.component';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarPortalComponent],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.css'
})
export class DoctorDashboardComponent implements OnInit {

  doctorName = '';
  todayDate = '';
  activeNav = 'overview';

  stats = {
    totalPatients: 0,
    todayAppointments: 3,
    pendingReports: 5,
    criticalAlerts: 2
  };

  recentPatients: Patient[] = [];

  appointments = [
    { time: '09:00', name: 'Marie Dupont', type: 'Follow-up', status: 'confirmed', avatar: 'MD' },
    { time: '10:30', name: 'Jean Martin', type: 'Cognitive Test', status: 'confirmed', avatar: 'JM' },
    { time: '14:00', name: 'Alice Bernard', type: 'Re-evaluation', status: 'pending', avatar: 'AB' },
  ];

  alerts = [
    { level: 'critical', patient: 'Marie Dupont', message: 'Rapid cognitive decline detected', time: '08:30', avatar: 'MD' },
    { level: 'warning', patient: 'Jean Martin', message: 'Medication non-adherence reported', time: '07:45', avatar: 'JM' },
    { level: 'info', patient: 'Alice Bernard', message: 'New lab results available', time: '06:00', avatar: 'AB' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    const profile = this.authService.profile();
    this.doctorName = profile?.firstName
      ? `${profile.firstName} ${profile.lastName ?? ''}`.trim()
      : (profile?.username ?? 'Doctor');

    this.todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    this.loadPatients();
  }

  loadPatients(): void {
    this.patientService.getAll().subscribe({
      next: (patients) => {
        this.recentPatients = patients.slice(0, 5);
        this.stats.totalPatients = patients.length;
      },
      error: () => {}
    });
  }

  setNav(nav: string): void {
    this.activeNav = nav;
  }

  goToPatients(): void {
    this.activeNav = 'patients';
    this.router.navigate(['/doctor-patients']);
  }

  goToAppointments(): void {
    this.activeNav = 'appointments';
    this.router.navigate(['/doctor-appointments']);
  }

  goToReports(): void {
    this.activeNav = 'reports';
    this.router.navigate(['/doctor-reports']);
  }

  goToAlerts(): void {
    this.activeNav = 'alerts';
    this.router.navigate(['/doctor-alerts']);
  }

  goToReportCreate(): void {
    this.router.navigate(['/doctor-report-create']);
  }

  // ── Add Patient Modal ──
  showAddModal = false;
  addLoading = false;
  addError = '';

  newPatient = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    phone: '',
    address: '',
    familyHistoryAlzheimer: false,
    status: 'stable',
    soignantId: 1
  };

  openAddModal(): void {
    this.showAddModal = true;
    this.addError = '';
    this.newPatient = {
      firstName: '', lastName: '', dateOfBirth: '',
      gender: 'Male', phone: '', address: '',
      familyHistoryAlzheimer: false, status: 'stable', soignantId: 1
    };
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  submitAddPatient(): void {
    if (!this.newPatient.firstName.trim() || !this.newPatient.lastName.trim()) {
      this.addError = 'First name and last name are required.';
      return;
    }
    this.addLoading = true;
    this.addError = '';
    this.patientService.create(this.newPatient).subscribe({
      next: () => {
        this.addLoading = false;
        this.showAddModal = false;
        this.loadPatients();
      },
      error: (err) => {
        this.addLoading = false;
        this.addError = 'Failed to add patient. Please try again.';
        console.error(err);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'high-risk': return 'badge-danger';
      case 'attention': return 'badge-warning';
      case 'stable': return 'badge-success';
      default: return 'badge-neutral';
    }
  }

  getInitials(patient: Patient): string {
    const f = patient.firstName || patient.prenom || patient.nomComplet?.split(' ')[0] || '?';
    const l = patient.lastName || patient.nom || patient.nomComplet?.split(' ').slice(-1)[0] || '?';
    return `${f[0]}${l[0]}`.toUpperCase();
  }

  getFullName(patient: Patient): string {
    if (patient.firstName || patient.lastName) {
      return `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim();
    }
    return patient.nomComplet || `${patient.prenom ?? ''} ${patient.nom ?? ''}`.trim() || 'Unknown';
  }
}
