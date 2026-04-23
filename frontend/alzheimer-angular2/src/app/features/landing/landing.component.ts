import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import keycloak from '../../keycloak';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    if (keycloak.authenticated) {
      void this.router.navigateByUrl(this.authService.getHomeRoute());
    }
  }

  login() {
    keycloak.login({
      redirectUri: window.location.origin
    });
  }

  register() {
    this.router.navigate(['/register']);
  }
}
