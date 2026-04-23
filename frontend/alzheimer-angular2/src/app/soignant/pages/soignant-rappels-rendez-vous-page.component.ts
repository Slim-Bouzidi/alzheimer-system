import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SoignantService } from '../soignant.service';
import { RappelRendezVous, isRappelRendezVous } from '../../models/rappel.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-soignant-rappels-rendez-vous-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './soignant-rappels-rendez-vous-page.component.html',
  styleUrls: ['../soignant-pages.css']
})
export class SoignantRappelsRendezVousPageComponent implements OnInit {
  rappels: RappelRendezVous[] = [];

  constructor(private soignantService: SoignantService, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.rappels = this.soignantService.getRappels().filter(isRappelRendezVous);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
