import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';
import { UserService } from '../../services/user.service';
import { HttpErrorResponse } from '@angular/common/http';
import keycloak from '../../keycloak';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    { label: 'Patient', value: 'PATIENT' }
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

      const email = this.registrationForm.value.email;

      this.userService.register(this.registrationForm.value).subscribe({
        next: () => {
          this.isSubmitting = false;
          // Auto-login: redirect to Keycloak login with email pre-filled
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
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.registrationForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      password: 'Password',
      firstName: 'First Name',
      lastName: 'Last Name',
      role: 'Role'
    };
    return labels[fieldName] || fieldName;
  }
}
