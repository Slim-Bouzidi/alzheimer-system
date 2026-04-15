import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { PatientService, PatientProfile } from '../../core/services/patient.service';
import keycloak from '../../keycloak';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, ButtonModule, InputNumberModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="profile-container animate-fade-in">
      <p-toast />
      
      <div class="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account settings and personal information.</p>
      </div>

      <div class="profile-grid">
        <p-card header="Personal Information" subheader="Update your details" styleClass="profile-card">
          <div class="form-grid">
            <div class="field">
              <label for="firstName">First Name</label>
              <input pInputText id="firstName" [(ngModel)]="profile.firstName" placeholder="Enter first name" />
            </div>
            
            <div class="field">
              <label for="lastName">Last Name</label>
              <input pInputText id="lastName" [(ngModel)]="profile.lastName" placeholder="Enter last name" />
            </div>

            <div class="field">
              <label for="age">Age</label>
              <p-inputNumber id="age" [(ngModel)]="profile.age" [min]="0" [max]="150" placeholder="Enter age" styleClass="w-full" />
            </div>

            <div class="field">
              <label>Account ID (Read-only)</label>
              <input pInputText [disabled]="true" [value]="profile.keycloakId" class="opacity-50" />
            </div>
          </div>

          <ng-template pTemplate="footer">
            <p-button label="Save Changes" icon="pi pi-check" (onClick)="saveProfile()" [loading]="saving" />
          </ng-template>
        </p-card>

        <p-card header="Security" styleClass="profile-card">
          <div class="security-info">
             <i class="pi pi-shield security-icon"></i>
             <div class="info-text">
                <h3>Account Managed by Keycloak</h3>
                <p>Your password and authentication are securely managed by the central authentication system.</p>
             </div>
          </div>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .profile-header {
      margin-bottom: 2rem;
      h1 {
        font-size: 2.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
      }
      p {
        color: #64748b;
        font-size: 1.1rem;
      }
    }

    .profile-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

    .profile-card {
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      border: 1px solid rgba(0,0,0,0.05);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      label {
        font-weight: 600;
        color: #475569;
        font-size: 0.9rem;
      }

      input, p-inputNumber {
        width: 100%;
      }
    }

    .security-info {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 12px;

      .security-icon {
        font-size: 2rem;
        color: #3b82f6;
      }

      h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 700;
      }

      p {
        margin: 0;
        color: #64748b;
        font-size: 0.95rem;
        line-height: 1.5;
      }
    }

    @media (max-width: 992px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  profile: PatientProfile = {
    keycloakId: keycloak.subject || '',
    firstName: '',
    lastName: '',
    age: 0
  };
  saving: boolean = false;

  constructor(
    private patientService: PatientService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.patientService.getMe().subscribe({
      next: (data) => {
        if (data) {
          this.profile = data;
        } else {
          // Initialize with Keycloak data if first time
          const token = keycloak.tokenParsed as any;
          this.profile.firstName = token?.given_name || '';
          this.profile.lastName = token?.family_name || '';
        }
      },
      error: (err) => {
        console.error('Failed to load profile', err);
      }
    });
  }

  saveProfile() {
    this.saving = true;
    this.patientService.updateMe(this.profile).subscribe({
      next: (res) => {
        this.messageService.add({severity:'success', summary:'Success', detail:'Profile updated successfully'});
        this.saving = false;
      },
      error: (err) => {
        this.messageService.add({severity:'error', summary:'Error', detail:'Failed to update profile'});
        this.saving = false;
      }
    });
  }
}
