import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';
import { ClinicalMetricsService, ClinicalRecord } from '../../../core/services/clinical-metrics.service';
import keycloak from '../../../keycloak';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, ConfirmDialogModule, ToastModule],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="reports-page">
      <p-toast />
      <p-confirmDialog styleClass="premium-confirm" />

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">
            <i class="pi pi-heart-fill header-icon"></i>
          </div>
          <div>
            <h1>Clinical Reports</h1>
            <p>Your personal health history and clinical metrics</p>
          </div>
        </div>
        <button class="btn-add" (click)="addNew()">
          <i class="pi pi-plus"></i> New Report
        </button>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar" *ngIf="records.length > 0">
        <div class="stat-item">
          <span class="stat-number">{{ records.length }}</span>
          <span class="stat-label">Total Records</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-number">{{ getAvgBmi() }}</span>
          <span class="stat-label">Avg. BMI</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-number">{{ getLatestBP() }}</span>
          <span class="stat-label">Latest BP</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-number">{{ getAvgHR() }}</span>
          <span class="stat-label">Avg. Heart Rate</span>
        </div>
      </div>

      <!-- Table Card -->
      <div class="table-card">
        <p-table
          [value]="records"
          [paginator]="true"
          [rows]="8"
          [rowsPerPageOptions]="[5, 8, 15]"
          styleClass="premium-table"
          [rowHover]="true">

          <ng-template pTemplate="header">
            <tr>
              <th>Date</th>
              <th>BMI</th>
              <th>Blood Pressure</th>
              <th>Heart Rate</th>
              <th>Blood Sugar</th>
              <th>Cholesterol</th>
              <th class="action-col">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-record>
            <tr class="data-row">
              <td>
                <div class="date-cell">
                  <span class="date-primary">{{ record.recordedAt | date:'MMM d, y' }}</span>
                  <span class="date-secondary">{{ record.recordedAt | date:'h:mm a' }}</span>
                </div>
              </td>
              <td>
                <span class="metric-badge" [ngClass]="getBmiClass(record.bmi)">
                  {{ record.bmi | number:'1.1-1' }}
                  <span class="badge-label">{{ getBmiLabel(record.bmi) }}</span>
                </span>
              </td>
              <td>
                <div class="bp-cell" [ngClass]="getBpClass(record.systolicBP)">
                  <span class="bp-value">{{ record.systolicBP }}<span class="bp-sep">/</span>{{ record.diastolicBP }}</span>
                  <span class="bp-unit">mmHg</span>
                </div>
              </td>
              <td>
                <div class="hr-cell" [ngClass]="getHrClass(record.heartRate)">
                  <i class="pi pi-heart"></i>
                  <span>{{ record.heartRate }}</span>
                  <span class="hr-unit">bpm</span>
                </div>
              </td>
              <td>
                <div class="lab-value">
                  <span class="lab-number" [ngClass]="record.bloodSugar && record.bloodSugar > 140 ? 'warn' : 'ok'">
                    {{ record.bloodSugar || '—' }}
                  </span>
                  <span class="lab-unit">mg/dL</span>
                </div>
              </td>
              <td>
                <div class="lab-value">
                  <span class="lab-number" [ngClass]="record.cholesterolTotal && record.cholesterolTotal > 200 ? 'warn' : 'ok'">
                    {{ record.cholesterolTotal || '—' }}
                  </span>
                  <span class="lab-unit">mg/dL</span>
                </div>
              </td>
              <td>
                <div class="action-btns">
                  <button class="btn-icon edit" (click)="editRecord(record)" title="Edit">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button class="btn-icon delete" (click)="deleteRecord(record)" title="Delete">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7">
                <div class="empty-state">
                  <i class="pi pi-file-plus empty-icon"></i>
                  <h3>No records yet</h3>
                  <p>Start tracking your health by adding your first clinical report.</p>
                  <button class="btn-add-empty" (click)="addNew()">
                    <i class="pi pi-plus"></i> Add First Report
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    .reports-page {
      font-family: 'Inter', sans-serif;
      padding: 2rem 2.5rem;
      max-width: 1300px;
      margin: 0 auto;
      background: #f8fafc;
      min-height: 100vh;
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.75rem;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .header-icon-wrap {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(239,68,68,0.35);
    }
    .header-icon {
      color: white;
      font-size: 1.4rem;
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.2;
    }
    .page-header p {
      color: #94a3b8;
      margin: 0;
      font-size: 0.875rem;
    }
    .btn-add {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 2px 8px rgba(37,99,235,0.35);
      transition: all 0.2s;
    }
    .btn-add:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(37,99,235,0.45);
    }

    /* Stats Bar */
    .stats-bar {
      display: flex;
      align-items: center;
      background: white;
      border-radius: 14px;
      padding: 1.25rem 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      gap: 0;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }
    .stat-number {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
      margin-top: 0.15rem;
    }
    .stat-divider {
      width: 1px;
      height: 40px;
      background: #e2e8f0;
    }

    /* Table Card */
    .table-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.07);
      overflow: hidden;
    }

    :host ::ng-deep .premium-table .p-datatable-thead > tr > th {
      background: #f8fafc;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      border-top: none;
    }
    :host ::ng-deep .premium-table .p-datatable-tbody > tr > td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    :host ::ng-deep .premium-table .p-datatable-tbody > tr:hover > td {
      background: #f8fafc;
    }
    :host ::ng-deep .premium-table .p-datatable-tbody > tr:last-child > td {
      border-bottom: none;
    }

    /* Date Cell */
    .date-cell {
      display: flex;
      flex-direction: column;
    }
    .date-primary {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
    }
    .date-secondary {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* BMI Badge */
    .metric-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.7rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.875rem;
    }
    .badge-label {
      font-weight: 400;
      font-size: 0.7rem;
      opacity: 0.85;
    }
    .bmi-underweight { background: #dbeafe; color: #1e40af; }
    .bmi-normal      { background: #dcfce7; color: #166534; }
    .bmi-overweight  { background: #fef9c3; color: #854d0e; }
    .bmi-obese       { background: #fee2e2; color: #991b1b; }

    /* BP Cell */
    .bp-cell {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
    }
    .bp-value {
      font-weight: 700;
      font-size: 1rem;
    }
    .bp-sep { color: #94a3b8; margin: 0 1px; }
    .bp-unit { font-size: 0.7rem; color: #94a3b8; }
    .bp-normal   .bp-value { color: #16a34a; }
    .bp-elevated .bp-value { color: #d97706; }
    .bp-high     .bp-value { color: #dc2626; }

    /* Heart Rate Cell */
    .hr-cell {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-weight: 600;
    }
    .hr-unit { font-size: 0.7rem; color: #94a3b8; font-weight: 400; }
    .hr-normal   { color: #16a34a; }
    .hr-low      { color: #2563eb; }
    .hr-elevated { color: #d97706; }
    .hr-high     { color: #dc2626; }
    .hr-cell .pi-heart { font-size: 0.75rem; }

    /* Lab Values */
    .lab-value {
      display: flex;
      align-items: baseline;
      gap: 0.3rem;
    }
    .lab-number {
      font-weight: 700;
      font-size: 0.95rem;
    }
    .lab-number.ok   { color: #16a34a; }
    .lab-number.warn { color: #dc2626; }
    .lab-unit { font-size: 0.7rem; color: #94a3b8; }

    /* Action buttons */
    .action-btns {
      display: flex;
      gap: 0.4rem;
    }
    .btn-icon {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      font-size: 0.8rem;
    }
    .btn-icon.edit {
      background: #eff6ff;
      color: #2563eb;
    }
    .btn-icon.edit:hover {
      background: #2563eb;
      color: white;
    }
    .btn-icon.delete {
      background: #fff1f2;
      color: #e11d48;
    }
    .btn-icon.delete:hover {
      background: #e11d48;
      color: white;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }
    .empty-icon {
      font-size: 3rem;
      color: #cbd5e1;
      margin-bottom: 1rem;
    }
    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem;
    }
    .empty-state p {
      color: #94a3b8;
      margin-bottom: 1.5rem;
    }
    .btn-add-empty {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      border: none;
      padding: 0.65rem 1.5rem;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .action-col { text-align: center; }

    :host ::ng-deep .p-paginator {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 0.75rem 1.5rem;
    }
  `]
})
export class ReportListComponent implements OnInit {
  records: ClinicalRecord[] = [];
  isPatient: boolean = false;

  constructor(
    private clinicalService: ClinicalMetricsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadRecords();
  }

  checkUserRole() {
    this.isPatient = keycloak.hasRealmRole('patient') || keycloak.hasResourceRole('patient');
  }

  loadRecords() {
    this.clinicalService.getMyRecords().subscribe({
      next: (data) => {
        this.records = data;
        if (data.length === 0 && !this.isPatient) this.loadFallbackRecords();
      },
      error: (err) => {
        if (!this.isPatient) this.loadFallbackRecords();
      }
    });
  }

  private loadFallbackRecords() {
    this.clinicalService.findByPatientId(1).subscribe({
      next: (data) => this.records = data,
      error: () => {}
    });
  }

  addNew() {
    this.router.navigate(['/clinical-reports/new']);
  }

  editRecord(record: ClinicalRecord) {
    this.router.navigate(['/clinical-reports/new'], { queryParams: { edit: record.id } });
  }

  deleteRecord(record: ClinicalRecord) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this report?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (record.id) {
          this.clinicalService.delete(record.id).subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Report removed' });
              this.loadRecords();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not delete report' })
          });
        }
      }
    });
  }

  getAvgBmi(): string {
    if (!this.records.length) return '—';
    const avg = this.records.reduce((s, r) => s + (r.bmi || 0), 0) / this.records.length;
    return avg.toFixed(1);
  }

  getLatestBP(): string {
    if (!this.records.length) return '—';
    const latest = this.records[0];
    return latest.systolicBP && latest.diastolicBP ? `${latest.systolicBP}/${latest.diastolicBP}` : '—';
  }

  getAvgHR(): string {
    if (!this.records.length) return '—';
    const avg = this.records.reduce((s, r) => s + (r.heartRate || 0), 0) / this.records.length;
    return Math.round(avg) + ' bpm';
  }

  getBmiClass(bmi: number): string {
    if (!bmi) return 'bmi-normal';
    if (bmi < 18.5) return 'bmi-underweight';
    if (bmi < 25) return 'bmi-normal';
    if (bmi < 30) return 'bmi-overweight';
    return 'bmi-obese';
  }

  getBmiLabel(bmi: number): string {
    if (!bmi) return '';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  getBpClass(systolic: number): string {
    if (!systolic) return 'bp-normal';
    if (systolic < 120) return 'bp-normal';
    if (systolic < 140) return 'bp-elevated';
    return 'bp-high';
  }

  getHrClass(hr: number): string {
    if (!hr) return 'hr-normal';
    if (hr < 60) return 'hr-low';
    if (hr <= 100) return 'hr-normal';
    if (hr <= 120) return 'hr-elevated';
    return 'hr-high';
  }
}

