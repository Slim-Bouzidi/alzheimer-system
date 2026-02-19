import { Component, EventEmitter, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PatientService } from '../../../services/patient.service';

@Component({
  selector: 'app-user-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    ToastModule
  ],
  template: `
    <p-dialog 
      header="Add New Profile" 
      [visible]="visible()" 
      (visibleChange)="onVisibleChange($event)"
      [modal]="true" 
      [style]="{ width: '450px' }" 
      [draggable]="false"
      [resizable]="false"
      styleClass="create-user-dialog"
    >
      <div class="dialog-content">
        <div class="input-group">
          <label for="role">User Role</label>
          <p-dropdown 
            id="role" 
            [options]="roles" 
            [(ngModel)]="user.role" 
            placeholder="Select a role"
            styleClass="w-full"
          />
        </div>

        <div class="input-row">
          <div class="input-group">
            <label for="firstName">First Name</label>
            <input 
              pInputText 
              id="firstName" 
              [(ngModel)]="user.firstName" 
              placeholder="e.g. John"
            />
          </div>
          <div class="input-group">
            <label for="lastName">Last Name</label>
            <input 
              pInputText 
              id="lastName" 
              [(ngModel)]="user.lastName" 
              placeholder="e.g. Doe"
            />
          </div>
        </div>

        <ng-container *ngIf="user.role === 'Patient'">
          <div class="input-group">
            <label for="age">Age</label>
            <p-inputNumber 
              id="age" 
              [(ngModel)]="user.age" 
              [min]="0" 
              [max]="150"
              placeholder="Enter age"
            />
          </div>
        </ng-container>

        <ng-container *ngIf="user.role === 'Caregiver'">
          <div class="input-group">
            <label for="email">Contact Email</label>
            <input 
              pInputText 
              id="email" 
              [(ngModel)]="user.email" 
              placeholder="caregiver@example.com"
            />
          </div>
        </ng-container>
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <p-button 
            label="Cancel" 
            [text]="true" 
            severity="secondary"
            (onClick)="onClose()" 
          />
          <p-button 
            label="Create Profile" 
            icon="pi pi-user-plus" 
            [loading]="loading()" 
            (onClick)="onCreate()" 
            [disabled]="!isValid()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem 0.5rem;
    }

    .input-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--text-color-secondary);
      }

      input, ::ng-deep .p-inputnumber, ::ng-deep .p-dropdown {
        width: 100%;
      }

      ::ng-deep .p-inputtext {
        padding: 0.75rem;
        border-radius: 8px;
        border: 1px solid var(--surface-border);
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid var(--surface-border);
    }
  `]
})
export class UserCreateDialogComponent {
  @Output() closed = new EventEmitter<void>();

  visible = signal(false);
  loading = signal(false);

  roles = [
    { label: 'Patient', value: 'Patient' },
    { label: 'Caregiver', value: 'Caregiver' }
  ];

  user = {
    role: 'Patient',
    firstName: '',
    lastName: '',
    age: null as number | null,
    email: ''
  };

  private patientService = inject(PatientService);
  private messageService = inject(MessageService);

  show() {
    console.log('[Dialog] show() called');
    this.user = {
      role: 'Patient',
      firstName: '',
      lastName: '',
      age: null,
      email: ''
    };
    this.visible.set(true);
    console.log('[Dialog] visible signal set to true');
  }

  onVisibleChange(val: boolean) {
    this.visible.set(val);
    if (!val) {
      this.closed.emit();
    }
  }

  onClose() {
    this.onVisibleChange(false);
  }

  isValid() {
    if (!this.user.firstName || !this.user.lastName) return false;
    if (this.user.role === 'Patient' && (this.user.age === null || this.user.age === undefined)) return false;
    return true;
  }

  onCreate() {
    if (this.user.role === 'Caregiver') {
        this.messageService.add({ 
          severity: 'info', 
          summary: 'Mock Feature', 
          detail: 'Caregiver creation is currently a UI mock.' 
        });
        this.onClose();
        return;
    }

    this.loading.set(true);
    const patientData = {
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      age: this.user.age
    };

    this.patientService.create(patientData).subscribe({
      next: () => {
        this.messageService.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: 'Patient profile created successfully' 
        });
        this.patientService.triggerRefresh();
        this.loading.set(false);
        this.onClose();
      },
      error: (err) => {
        console.error('Creation failed:', err);
        this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Failed to create patient profile' 
        });
        this.loading.set(false);
      }
    });
  }
}
