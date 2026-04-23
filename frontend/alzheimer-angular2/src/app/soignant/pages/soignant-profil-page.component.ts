import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-soignant-profil-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <header class="topbar-page">
      <h1>{{ 'SOIGNANT_PROFILE.TITLE' | translate }}</h1>
      <button class="btn-outline" (click)="logout()">{{ 'COMMON.LOGOUT' | translate }}</button>
    </header>
    <main class="content-area">
      <section class="card">
        <div class="card-header"><h2>{{ 'SOIGNANT_PROFILE.CAREGIVER_INFO' | translate }}</h2></div>
        <p>{{ 'SOIGNANT_PROFILE.CAREGIVER_INFO_DESC' | translate }}</p>
        <p class="empty-msg">{{ 'COMMON.COMING_SOON' | translate }}</p>
      </section>
    </main>
  `,
  styleUrls: ['../soignant-pages.css']
})
export class SoignantProfilPageComponent {
  constructor(private router: Router, private authService: AuthService) {}
  async logout(): Promise<void> { await this.authService.logout(); }
}
