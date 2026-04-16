import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SoignantService } from '../soignant.service';
import { RapportHebdomadaire } from '../../models/rapport-hebdo.model';

@Component({
  selector: 'app-soignant-rapports-hebdo-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './soignant-rapports-hebdo-page.component.html',
  styleUrls: ['../soignant-pages.css', './soignant-rapports-hebdo-page.component.css']
})
export class SoignantRapportsHebdoPageComponent implements OnInit {
  rapports: RapportHebdomadaire[] = [];

  constructor(private soignantService: SoignantService, private router: Router) {}

  ngOnInit(): void {
    this.rapports = this.soignantService.getRapportsHebdomadaires();
  }

  envoyer(id: string): void {
    this.soignantService.envoyerRapportHebdoAuMedecin(id).subscribe(() => {
      this.rapports = this.soignantService.getRapportsHebdomadaires();
    });
  }

  logout(): void { this.router.navigate(['/test']); }
}
