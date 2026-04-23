import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SoignantService } from '../soignant.service';
import { RappelMedicament, isRappelMedicament } from '../../models/rappel.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-soignant-rappels-medicaments-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './soignant-rappels-medicaments-page.component.html',
  styleUrls: ['../soignant-pages.css']
})
export class SoignantRappelsMedicamentsPageComponent implements OnInit {
  rappels: RappelMedicament[] = [];

  constructor(private soignantService: SoignantService, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.rappels = this.soignantService.getRappels().filter(isRappelMedicament);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
