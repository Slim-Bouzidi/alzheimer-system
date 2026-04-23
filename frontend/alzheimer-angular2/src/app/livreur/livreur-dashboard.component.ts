import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-livreur-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './livreur-dashboard.component.html',
  styleUrls: ['./livreur-dashboard.component.css']
})
export class LivreurDashboardComponent {
  currentDate = new Date();

  constructor(private readonly authService: AuthService) {}

  get livreurName(): string {
    return this.authService.getDisplayName(false);
  }
}
