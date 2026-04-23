import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SoignantService } from '../soignant.service';
import { PatientSoignant } from '../../models/patient-soignant.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-soignant-patients-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './soignant-patients-page.component.html',
  styleUrls: ['../soignant-pages.css']
})
export class SoignantPatientsPageComponent implements OnInit {
  patients: PatientSoignant[] = [];

  constructor(private soignantService: SoignantService, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.patients = this.soignantService.getPatientsAssignes();
  }

  risqueClass(s: string): string {
    return s === 'eleve' ? 'risque-eleve' : s === 'moyen' ? 'risque-moyen' : 'risque-faible';
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
