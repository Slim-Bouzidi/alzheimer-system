import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import keycloak from '../../keycloak';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, ButtonModule, InputNumberModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="profile-container" style="padding: 2rem; max-width: 800px; margin: 0 auto;">
      <p-toast />
      
      <div style="margin-bottom: 2rem;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">My Profile</h1>
        <p style="color: #64748b;">Manage your account settings and personal information.</p>
      </div>

      <p-card header="Personal Information" subheader="Your Keycloak account details" styleClass="mb-4">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">First Name</label>
            <input pInputText [value]="firstName" [disabled]="true" class="w-full opacity-70" />
          </div>
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Last Name</label>
            <input pInputText [value]="lastName" [disabled]="true" class="w-full opacity-70" />
          </div>
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Email</label>
            <input pInputText [value]="email" [disabled]="true" class="w-full opacity-70" />
          </div>
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Account ID</label>
            <input pInputText [value]="keycloakId" [disabled]="true" class="w-full opacity-70" />
          </div>
        </div>
        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Roles</label>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <span *ngFor="let role of roles" 
                  style="background: #e0e7ff; color: #3730a3; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500;">
              {{ role }}
            </span>
          </div>
        </div>
      </p-card>

      <p-card header="Security">
        <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem 0;">
          <i class="pi pi-shield" style="font-size: 2rem; color: #4F46E5;"></i>
          <div>
            <h3 style="font-weight: 600; margin-bottom: 0.25rem;">Account Managed by Keycloak</h3>
            <p style="color: #64748b; font-size: 0.875rem;">
              Your password and security settings are managed through Keycloak.
              To change your password or update security settings, please use the Keycloak portal.
            </p>
          </div>
        </div>
      </p-card>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  firstName = '';
  lastName = '';
  email = '';
  keycloakId = '';
  roles: string[] = [];

  ngOnInit(): void {
    if (keycloak.tokenParsed) {
      this.firstName = keycloak.tokenParsed['given_name'] || '';
      this.lastName = keycloak.tokenParsed['family_name'] || '';
      this.email = keycloak.tokenParsed['email'] || '';
      this.keycloakId = keycloak.tokenParsed['sub'] || '';
      const defaultRoles = ['offline_access', 'uma_authorization'];
      this.roles = (keycloak.realmAccess?.roles || [])
        .filter(r => !defaultRoles.includes(r) && !r.startsWith('default-roles-'));
    }
  }
}
