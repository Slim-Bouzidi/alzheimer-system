import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';
import { UserService, UserRegistrationRequest } from '../../services/user.service';
import { HttpErrorResponse } from '@angular/common/http';
import keycloak from '../../keycloak';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    DropdownModule,
    MessageModule
  ],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent {
  registrationForm: FormGroup;
  errorMessage: string = '';
  isSubmitting: boolean = false;

  roleOptions = [
    { label: 'Doctor', value: 'DOCTOR' },
    { label: 'Caregiver', value: 'CAREGIVER' },
    { label: 'Patient', value: 'PATIENT' },
    { label: 'Soignant', value: 'SOIGNANT' },
    { label: 'Livreur', value: 'LIVREUR' }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.registrationForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      role: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const { email, password, firstName, lastName, role } = this.registrationForm.value;
      const payload: UserRegistrationRequest = { email, password, firstName, lastName, role };

      this.userService.register(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          keycloak.login({
            loginHint: email,
            redirectUri: window.location.origin + '/'
          });
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting = false;
          this.handleRegistrationError(error);
        }
      });
    } else {
      this.markFormGroupTouched(this.registrationForm);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private handleRegistrationError(error: HttpErrorResponse): void {
    if (error.status === 400) {
      this.errorMessage = 'Invalid input. Please check your email format and ensure password is at least 8 characters.';
    } else if (error.status === 409) {
      this.errorMessage = 'This email is already registered. Please use a different email or login.';
    } else if (error.status === 503) {
      this.errorMessage = 'Registration service is temporarily unavailable. Please try again later.';
    } else {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }
}
