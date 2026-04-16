import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-test-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; text-align: center;">
      <h1>🩺 Page de Test - Dashboard Médecin</h1>
      <p>Cette page fonctionne correctement !</p>
      <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2>📊 Statistiques de Test</h2>
        <p>Patients: 24 | Rendez-vous: 8 | Alertes: 3</p>
      </div>
      <p style="margin: 16px 0 8px 0; font-weight: 600;">Choisir un tableau de bord :</p>
      <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 10px;">
        <button (click)="goToDoctorDashboard()" style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
          Accéder au Dashboard Médecin
        </button>
        <button (click)="goToSoignantDashboard()" style="padding: 12px 24px; background: #059669; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
          Accéder au Dashboard Soignant
        </button>
        <button (click)="goToPatientDashboard()" style="padding: 12px 24px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
          Accéder au Dashboard Patient
        </button>
        <button (click)="goToLivreurDashboard()" style="padding: 12px 24px; background: #f59e0b; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
          Accéder au Dashboard Livreur
        </button>
      </div>
    </div>
  `
})
export class TestPageComponent {
  constructor(private router: Router) { }

  goToDoctorDashboard() {
    this.router.navigate(['/doctor-dashboard']);
  }

  goToSoignantDashboard() {
    this.router.navigate(['/soignant-dashboard']);
  }

  goToPatientDashboard() {
    this.router.navigate(['/patient-dashboard']);
  }

  goToLivreurDashboard() {
    this.router.navigate(['/livreur-dashboard']);
  }
}
