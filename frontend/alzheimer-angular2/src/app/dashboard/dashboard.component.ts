import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, UserProfile } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  day: string = '';
  monthYear: string = '';
  weekday: string = '';
  time: string = '';
  greeting: string = '';

  constructor(
    public authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) { }

  get currentUser(): UserProfile | null {
    return this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.updateDateTime();
  }

  private updateDateTime(): void {
    const now = new Date();
    this.day = now.getDate().toString();
    this.monthYear = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    this.weekday = now.toLocaleDateString('fr-FR', { weekday: 'long' });
    this.time = now.toLocaleTimeString('fr-FR');

    const hours = now.getHours();
    if (hours < 12) this.greeting = this.translate.instant('DASHBOARD.GREETING_MORNING');
    else if (hours < 18) this.greeting = this.translate.instant('DASHBOARD.GREETING_AFTERNOON');
    else this.greeting = this.translate.instant('DASHBOARD.GREETING_EVENING');
  }

  getRoleDisplayName(): string {
    if (this.authService.isAdmin()) return this.translate.instant('ROLES.ADMIN');
    if (this.authService.isDoctor()) return this.translate.instant('ROLES.DOCTOR');
    if (this.authService.isCaregiver()) return this.translate.instant('ROLES.CAREGIVER');
    if (this.authService.isSoignant()) return this.translate.instant('ROLES.SOIGNANT');
    if (this.authService.isLivreur()) return this.translate.instant('ROLES.LIVREUR');
    if (this.authService.isPatient()) return this.translate.instant('ROLES.PATIENT');
    return this.translate.instant('ROLES.UNKNOWN');
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
