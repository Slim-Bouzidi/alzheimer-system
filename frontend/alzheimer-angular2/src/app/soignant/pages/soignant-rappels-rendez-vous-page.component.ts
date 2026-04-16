import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SoignantService } from '../soignant.service';
import { RappelRendezVous, isRappelRendezVous } from '../../models/rappel.model';

@Component({
  selector: 'app-soignant-rappels-rendez-vous-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './soignant-rappels-rendez-vous-page.component.html',
  styleUrls: ['../soignant-pages.css']
})
export class SoignantRappelsRendezVousPageComponent implements OnInit {
  rappels: RappelRendezVous[] = [];

  constructor(private soignantService: SoignantService, private router: Router) {}

  ngOnInit(): void {
    this.rappels = this.soignantService.getRappels().filter(isRappelRendezVous);
  }

  logout(): void {
    this.router.navigate(['/test']);
  }
}
