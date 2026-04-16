import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SoignantService } from '../soignant.service';
import { RappelRepas, isRappelRepas } from '../../models/rappel.model';

@Component({
  selector: 'app-soignant-rappels-repas-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './soignant-rappels-repas-page.component.html',
  styleUrls: ['../soignant-pages.css']
})
export class SoignantRappelsRepasPageComponent implements OnInit {
  rappels: RappelRepas[] = [];

  constructor(private soignantService: SoignantService, private router: Router) {}

  ngOnInit(): void {
    this.rappels = this.soignantService.getRappels().filter(isRappelRepas);
  }

  logout(): void {
    this.router.navigate(['/test']);
  }
}
