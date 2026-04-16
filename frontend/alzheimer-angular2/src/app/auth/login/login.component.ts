import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../auth.service';
import { User, UserRole, LoginResponse } from '../../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  loginError = '';

  demoAccounts = [
    { email: 'soignant@alzheimer.fr', password: 'soignant123', role: 'Soignant', description: 'Accès soignant (Agenda/Suivi)' },
    { email: 'doctor@alzheimer.fr', password: 'doctor123', role: 'Docteur', description: 'Accès médecin (Gestion/Rapports)' },
    { email: 'aidant@alzheimer.fr', password: 'aidant123', role: 'Aidant', description: 'Accès aidant familial' },
    { email: 'admin@alzheimer.fr', password: 'admin123', role: 'Admin', description: 'Accès administrateur' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = '';

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (response: LoginResponse) => {
          this.isLoading = false;
          const user = response.user;

          // Redirection selon le rôle
          switch (user.role) {
            case UserRole.SOIGNANT:
              this.router.navigate(['/soignant-dashboard']);
              break;
            case UserRole.DOCTEUR:
              this.router.navigate(['/doctor-dashboard']);
              break;
            case UserRole.AIDANT:
              this.router.navigate(['/dashboard']);
              break;
            case UserRole.ADMIN:
              this.router.navigate(['/dashboard']);
              break;
            case UserRole.PATIENT:
              this.router.navigate(['/dashboard']);
              break;
            default:
              this.router.navigate(['/dashboard']);
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          this.loginError = this.translate.instant('AUTH.LOGIN_ERROR');
        }
      });
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  fillDemoAccount(account: any): void {
    this.loginForm.patchValue({
      email: account.email,
      password: account.password
    });
  }
}
