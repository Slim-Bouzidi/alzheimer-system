import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { SoignantService } from './soignant.service';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-soignant-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, TranslateModule],
  templateUrl: './soignant-layout.component.html',
  styleUrls: ['./soignant-layout.component.css']
})
export class SoignantLayoutComponent implements OnInit {
  alertesNonTraiteesCount = 0;
  rapportsNonLusCount = 0;
  rapportHebdoNonEnvoye = false;
  notificationsCount = 0;
  suiviRempliAujourdhui = false;
  constructor(private soignantService: SoignantService, private authService: AuthService) { }

  get soignantName(): string {
    return this.authService.getDisplayName(false);
  }

  ngOnInit(): void {
    this.refreshBadges();
  }

  refreshBadges(): void {
    const alertes = this.soignantService.getAlertesActives();
    const rapports = this.soignantService.getRapportsMedicauxRecus();
    const rapportsHebdo = this.soignantService.getRapportsHebdomadaires();
    const notifications = this.soignantService.getNotificationsTache();
    const today = new Date().toISOString().slice(0, 10);
    const formulaires = this.soignantService.getFormulairesSuiviQuotidien();
    this.alertesNonTraiteesCount = alertes.filter(a => a.statut !== 'TRAITEE').length;
    this.rapportsNonLusCount = rapports.filter(r => !r.lu).length;
    this.rapportHebdoNonEnvoye = rapportsHebdo.some(r => !r.envoyeAuMedecin);
    this.notificationsCount = notifications.filter(n => n.statut === 'a_faire').length;
    this.suiviRempliAujourdhui = formulaires.some(f => f.date === today);
  }


}
