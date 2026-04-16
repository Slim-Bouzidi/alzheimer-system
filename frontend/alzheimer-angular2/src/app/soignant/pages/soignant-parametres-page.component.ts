import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-soignant-parametres-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <header class="topbar-page">
      <h1>{{ 'SOIGNANT_SETTINGS.TITLE' | translate }}</h1>
      <button class="btn-outline" (click)="logout()">{{ 'COMMON.LOGOUT' | translate }}</button>
    </header>
    <main class="content-area">
      <section class="card">
        <div class="card-header"><h2>{{ 'SOIGNANT_SETTINGS.PERSONAL_CONFIG' | translate }}</h2></div>
        <p>{{ 'SOIGNANT_SETTINGS.PERSONAL_CONFIG_DESC' | translate }}</p>
        <p class="empty-msg">{{ 'COMMON.COMING_SOON' | translate }}</p>
      </section>
    </main>
  `,
  styleUrls: ['../soignant-pages.css']
})
export class SoignantParametresPageComponent {
  constructor(private router: Router) {}
  logout(): void { this.router.navigate(['/test']); }
}
