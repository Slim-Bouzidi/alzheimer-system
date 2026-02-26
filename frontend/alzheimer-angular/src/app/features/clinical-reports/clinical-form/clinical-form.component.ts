import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { SliderModule } from 'primeng/slider';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService, PatientProfile } from '../../../core/services/patient.service';
import { ClinicalMetricsService } from '../../../core/services/clinical-metrics.service';
import keycloak from '../../../keycloak';

@Component({
  selector: 'app-clinical-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, InputNumberModule, 
    DropdownModule, SliderModule, InputSwitchModule, 
    ButtonModule, ToastModule, DividerModule, TooltipModule
  ],
  providers: [MessageService],
  template: `
    <div class="pro-clinical-dashboard animate-fade-in">
      <p-toast />
      
      <div class="glass-header">
        <div class="header-left">
          <div class="icon-orb" [class.edit-mode]="isEditMode">
            <i class="pi" [class.pi-heart-fill]="!isEditMode" [class.pi-pencil]="isEditMode"></i>
          </div>
          <div class="titles">
            <h1>{{ isEditMode ? 'Update Clinical Record' : 'Health Assessment' }}</h1>
            <p>{{ isEditMode ? 'Refining previously recorded medical metrics' : 'Sync your clinical metrics with your medical profile' }}</p>
          </div>
        </div>
        <div class="header-right">
          <span class="badge" [class.edit-badge]="isEditMode">{{ isEditMode ? 'Modifier' : 'Patient View' }}</span>
        </div>
      </div>

      <div class="pro-grid-layout">
        <!-- Vitals & Labs Section -->
        <div class="form-section">
          <p-card styleClass="premium-card">
            <div class="card-headline">
              <i class="pi pi-wave-pulse"></i>
              <h3>Biometrics & Laboratory</h3>
            </div>
            <p-divider />
            
            <div class="compact-form">
              <div class="input-cell full">
                <label>Body Mass Index (BMI)</label>
                <p-inputNumber [(ngModel)]="profile.bmi" mode="decimal" [minFractionDigits]="1" [showButtons]="true" buttonLayout="horizontal" incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" styleClass="pro-inputnumber" />
                <small class="p-error" *ngIf="errors['bmi']">{{errors['bmi']}}</small>
              </div>

              <div class="input-cell full">
                <label>Blood Pressure (mmHg)</label>
                <div class="bp-composite">
                  <p-inputNumber [(ngModel)]="profile.systolicBP" placeholder="Sys" pTooltip="Systolic" />
                  <span class="slash">/</span>
                  <p-inputNumber [(ngModel)]="profile.diastolicBP" placeholder="Dia" pTooltip="Diastolic" />
                </div>
                <small class="p-error" *ngIf="errors['systolicBP']">{{errors['systolicBP']}}</small>
                <small class="p-error" *ngIf="errors['diastolicBP']">{{errors['diastolicBP']}}</small>
              </div>

              <div class="grid-2">
                <div class="input-cell">
                  <label>Heart Rate</label>
                  <p-inputNumber [(ngModel)]="profile.heartRate" suffix=" BPM" placeholder="72" />
                  <small class="p-error" *ngIf="errors['heartRate']">{{errors['heartRate']}}</small>
                </div>
                <div class="input-cell">
                  <label>Blood Sugar</label>
                  <p-inputNumber [(ngModel)]="profile.bloodSugar" suffix=" mg/dL" [minFractionDigits]="1" placeholder="95.0" />
                  <small class="p-error" *ngIf="errors['bloodSugar']">{{errors['bloodSugar']}}</small>
                </div>
              </div>

              <div class="input-cell full">
                <label>Total Cholesterol</label>
                <p-inputNumber [(ngModel)]="profile.cholesterolTotal" suffix=" mg/dL" [minFractionDigits]="1" placeholder="180.0" styleClass="w-full" />
                <small class="p-error" *ngIf="errors['cholesterolTotal']">{{errors['cholesterolTotal']}}</small>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Lifestyle Section -->
        <div class="form-section">
          <p-card styleClass="premium-card">
            <div class="card-headline">
              <i class="pi pi-sun"></i>
              <h3>Lifestyle & Habits</h3>
            </div>
            <p-divider />

            <div class="compact-form">
              <div class="input-cell full">
                <label>Smoking History</label>
                <p-dropdown [options]="smokingOptions" [(ngModel)]="profile.smokingStatus" optionLabel="label" optionValue="value" styleClass="pro-dropdown" placeholder="Select status" />
              </div>

              <div class="input-cell full">
                <label>Alcohol Habits</label>
                <p-dropdown [options]="alcoholOptions" [(ngModel)]="profile.alcoholConsumption" optionLabel="label" optionValue="value" styleClass="pro-dropdown" placeholder="Select status" />
              </div>

              <div class="pro-slider-item">
                <div class="slider-meta">
                  <label>Physical Activity</label>
                  <span class="value-tag">{{profile.physicalActivity || 0}}/10</span>
                </div>
                <p-slider [(ngModel)]="profile.physicalActivity" [min]="0" [max]="10" styleClass="pro-slider" />
              </div>

              <div class="pro-slider-item">
                <div class="slider-meta">
                  <label>Diet Quality</label>
                  <span class="value-tag">{{profile.dietQuality || 0}}/10</span>
                </div>
                <p-slider [(ngModel)]="profile.dietQuality" [min]="0" [max]="10" styleClass="pro-slider info" />
              </div>

              <div class="pro-slider-item">
                <div class="slider-meta">
                  <label>Sleep Hygiene</label>
                  <span class="value-tag">{{profile.sleepQuality || 0}}/10</span>
                </div>
                <p-slider [(ngModel)]="profile.sleepQuality" [min]="0" [max]="10" styleClass="pro-slider success" />
              </div>
            </div>
          </p-card>
        </div>

        <!-- Risk Factors Section -->
        <div class="form-section full-width">
          <p-card styleClass="premium-card">
            <div class="card-headline">
              <i class="pi pi-exclamation-circle"></i>
              <h3>Medical History & Risk Factors</h3>
            </div>
            <p-divider />
            
            <div class="risk-toggles">
              <div class="toggle-box">
                <div class="toggle-info">
                  <span class="title">Family History</span>
                  <p>Genetic history of Alzheimer's</p>
                </div>
                <p-inputSwitch [(ngModel)]="profile.familyHistory" />
              </div>

              <div class="toggle-box">
                <div class="toggle-info">
                  <span class="title">Diabetes</span>
                  <p>Diagnosed Type 1 or Type 2</p>
                </div>
                <p-inputSwitch [(ngModel)]="profile.diabetes" />
              </div>

              <div class="toggle-box">
                <div class="toggle-info">
                  <span class="title">Hypertension</span>
                  <p>Chronic high blood pressure</p>
                </div>
                <p-inputSwitch [(ngModel)]="profile.hypertension" />
              </div>
            </div>
          </p-card>
        </div>

        <div class="footer-actions full-width">
          <p-button [label]="isEditMode ? 'Commit Changes' : 'Submit Updated Assessment'" [icon]="isEditMode ? 'pi pi-check-circle' : 'pi pi-cloud-upload'" (onClick)="saveHealthData()" [loading]="loading" styleClass="pro-action-btn" />
          <p-button *ngIf="isEditMode" label="Go Back" icon="pi pi-arrow-left" styleClass="p-button-text p-button-secondary ml-3" (onClick)="cancelEdit()" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary-gradient: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
      --edit-gradient: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
      --surface-glass: rgba(255, 255, 255, 0.8);
      --border-light: rgba(226, 232, 240, 0.8);
    }

    .pro-clinical-dashboard {
      padding: 2rem 4rem;
      background: #f8fafc;
      min-height: 100vh;
    }

    .glass-header {
      background: var(--surface-glass);
      backdrop-filter: blur(10px);
      padding: 2rem;
      border-radius: 24px;
      border: 1px solid var(--border-light);
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);

      .header-left {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }

      .icon-orb {
        width: 60px;
        height: 60px;
        background: var(--primary-gradient);
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.5rem;
        box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
      }

      .icon-orb.edit-mode {
        background: var(--edit-gradient);
        box-shadow: 0 8px 16px rgba(14, 165, 233, 0.3);
      }

      h1 { font-size: 1.8rem; font-weight: 800; color: #1e293b; margin: 0; }
      p { color: #64748b; margin: 0.25rem 0 0 0; }

      .badge {
        background: #e0f2fe;
        color: #0369a1;
        padding: 0.5rem 1rem;
        border-radius: 30px;
        font-weight: 700;
        font-size: 0.8rem;
        text-transform: uppercase;
      }

      .badge.edit-badge {
        background: #f0f9ff;
        color: #0ea5e9;
      }
    }

    .pro-grid-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .full-width { grid-column: span 2; }

    ::ng-deep .premium-card {
      background: white !important;
      border-radius: 24px !important;
      border: 1px solid var(--border-light) !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
      padding: 1rem;

      .card-headline {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        h3 { margin: 0; color: #334155; font-size: 1.1rem; font-weight: 700; }
        i { color: #6366f1; font-size: 1.2rem; }
      }
    }

    .compact-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .input-cell {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      label { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    }

    .bp-composite {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      .slash { color: #cbd5e1; font-size: 1.2rem; }
      ::ng-deep p-inputNumber { flex: 1; .p-inputtext { width: 100%; text-align: center; border-radius: 12px; } }
    }

    .p-error {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      font-weight: 600;
    }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    ::ng-deep .pro-inputnumber, ::ng-deep .pro-dropdown {
      width: 100%;
      .p-inputtext, .p-dropdown { border-radius: 12px !important; border: 1.5px solid #f1f5f9 !important; background: #f8fafc !important; }
    }

    .pro-slider-item {
      margin-top: 0.5rem;
      .slider-meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.75rem;
        label { font-weight: 700; color: #475569; font-size: 0.9rem; }
        .value-tag { background: #f1f5f9; padding: 0.15rem 0.6rem; border-radius: 6px; font-weight: 800; color: #6366f1; font-size: 0.8rem; }
      }
    }

    .risk-toggles {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .toggle-box {
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #f1f5f9;
      
      .toggle-info {
        .title { display: block; font-weight: 700; color: #1e293b; margin-bottom: 0.2rem; }
        p { font-size: 0.8rem; color: #94a3b8; margin: 0; }
      }
    }

    .pro-action-btn {
      background: var(--primary-gradient) !important;
      border: none !important;
      border-radius: 16px !important;
      padding: 1.25rem 3rem !important;
      font-weight: 700 !important;
      font-size: 1.1rem !important;
      box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 15px 30px -8px rgba(99, 102, 241, 0.5) !important; }
    }

    .ml-3 { margin-left: 1rem; }

    .footer-actions { display: flex; justify-content: center; padding: 2rem 0; }

    /* Animations */
    .animate-fade-in {
      animation: fadeIn 0.8s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 1000px) {
      .pro-grid-layout { grid-template-columns: 1fr; }
      .full-width { grid-column: auto; }
      .risk-toggles { grid-template-columns: 1fr; }
    }
  `]
})
export class ClinicalFormComponent implements OnInit {
  profile: PatientProfile = {
    firstName: '',
    lastName: '',
    age: 0,
    keycloakId: keycloak.subject || '',
    physicalActivity: 5,
    dietQuality: 5,
    sleepQuality: 5
  };
  
  errors: any = {};
  loading: boolean = false;
  isEditMode: boolean = false;
  editRecordId: number | null = null;

  smokingOptions = [
    {label: 'Never Smoked', value: 'NEVER'},
    {label: 'Former Smoker', value: 'FORMER'},
    {label: 'Current Smoker', value: 'CURRENT'}
  ];

  alcoholOptions = [
    {label: 'Non-drinker', value: 'NONE'},
    {label: 'Occasional', value: 'OCCASIONAL'},
    {label: 'Frequent', value: 'FREQUENT'}
  ];

  constructor(
    private patientService: PatientService,
    private clinicalService: ClinicalMetricsService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
        if (params['edit']) {
            this.isEditMode = true;
            this.editRecordId = +params['edit'];
            this.loadRecordForEdit(this.editRecordId);
        } else {
            this.loadMyData();
        }
    });
  }

  loadRecordForEdit(id: number) {
    this.clinicalService.getMyRecords().subscribe(records => {
        const record = records.find(r => r.id === id);
        if (record) {
            // Merge record data into the profile (except ID which should stay consistent if we ever use Patient ID vs Record ID)
            this.profile = { ...this.profile, ...record };
        }
    });
  }

  loadMyData() {
    this.patientService.getMe().subscribe({
      next: (data) => {
        if (data) this.profile = data;
      },
      error: (err) => {
        if (this.profile.firstName === '') {
            this.profile.firstName = keycloak.idTokenParsed?.['given_name'] || 'User';
        }
      }
    });
  }

  saveHealthData() {
    this.loading = true;
    this.errors = {};

    if (this.isEditMode && this.editRecordId) {
        // Update existing record
        this.clinicalService.update(this.editRecordId, this.profile as any).subscribe({
            next: () => {
                this.messageService.add({severity:'success', summary:'Entry Modified', detail:'History record has been successfully updated.'});
                this.loading = false;
                setTimeout(() => this.router.navigate(['/clinical-reports/history']), 1000);
            },
            error: (err) => {
                this.loading = false;
                if (err.status === 400 && err.error) {
                    this.errors = err.error;
                } else {
                    this.messageService.add({severity:'error', summary:'Update Failed', detail:'Could not save changes.'});
                }
            }
        });
    } else {
        // Create new record flow
        this.patientService.updateMe(this.profile).subscribe({
            next: (res) => {
                this.profile = res;
                this.createHistoricReport();
            },
            error: (err) => {
                this.loading = false;
                if (err.status === 400 && err.error) {
                    this.errors = err.error;
                } else {
                    this.messageService.add({severity:'error', summary:'Update Failed', detail:'Network error. Check console.'});
                }
            }
        });
    }
  }

  private createHistoricReport() {
    const report: any = {
        ...this.profile,
        patientId: this.profile.id,
        recordedBy: (keycloak.idTokenParsed as any)?.['preferred_username'] || 'Patient'
    };

    this.clinicalService.create(report).subscribe({
        next: () => {
            this.messageService.add({severity:'success', summary:'Profile Synchronized', detail:'Health metrics successfully updated and logged.'});
            this.loading = false;
        },
        error: (err) => {
            this.loading = false;
            if (err.status === 400 && err.error) {
                this.errors = err.error;
            } else {
                this.messageService.add({severity:'warn', summary:'Partially Saved', detail:'Profile updated, but historic record failed.'});
            }
        }
    });
  }

  cancelEdit() {
    this.router.navigate(['/clinical-reports/history']);
  }
}
