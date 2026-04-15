import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import keycloak from '../../keycloak';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  constructor(private router: Router) {}

  login() {
    keycloak.login({
      redirectUri: window.location.origin + '/dashboard'
    });
  }

  register() {
    this.router.navigate(['/register']);
  }
}
