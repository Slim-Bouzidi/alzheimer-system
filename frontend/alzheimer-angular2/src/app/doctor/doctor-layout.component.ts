import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './doctor-layout.component.html',
  styleUrls: ['./doctor-layout.component.css']
})
export class DoctorLayoutComponent {
  pageTitle = 'Portail medecin';
  pageSubtitle = 'Navigation medicale unifiee pour les parcours cliniques.';

  constructor(
    private readonly authService: AuthService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router
  ) {
    this.updatePageMetadata();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.updatePageMetadata());
  }

  get doctorName(): string {
    return this.authService.getDisplayName(true);
  }

  get doctorRole(): string {
    return this.authService.getRoleDisplayName();
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  private updatePageMetadata(): void {
    let route = this.activatedRoute;

    while (route.firstChild) {
      route = route.firstChild;
    }

    const data = route.snapshot?.data ?? {};
    this.pageTitle = data['pageTitle'] ?? 'Portail medecin';
    this.pageSubtitle = data['pageSubtitle'] ?? 'Navigation medicale unifiee pour les parcours cliniques.';
  }
}