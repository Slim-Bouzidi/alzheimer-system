import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../auth/auth.service';
import { User, UserRole } from '../models/user.model';

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
  currentUser: User | null = null;
  UserRole = UserRole;

  day: string = '';
  monthYear: string = '';
  weekday: string = '';
  time: string = '';
  greeting: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.updateDateTime();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
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

  getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return this.translate.instant('ROLES.ADMIN');
      case UserRole.AIDANT:
        return this.translate.instant('ROLES.AIDANT');
      case UserRole.SOIGNANT:
        return this.translate.instant('ROLES.SOIGNANT');
      case UserRole.PATIENT:
        return this.translate.instant('ROLES.PATIENT');
      default:
        return this.translate.instant('ROLES.UNKNOWN');
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
}
