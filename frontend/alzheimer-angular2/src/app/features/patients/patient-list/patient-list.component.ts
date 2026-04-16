import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PatientService } from '../../../services/patient.service';
import { Patient } from '../../../core/models/patient.model';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule,
    ButtonModule, InputTextModule, InputNumberModule, DialogModule, ToastModule
  ],
  providers: [MessageService],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss'
})
export class PatientListComponent implements OnInit {
  private patientService = inject(PatientService);
  private messageService = inject(MessageService);

  patients = signal<Patient[]>([]);
  loading = signal(true);

  dialogVisible = signal(false);
  dialogMode = signal<'create' | 'edit'>('create');
  formModel: any = { id: null, patientCode: '', firstName: '', lastName: '', age: null, latitude: null, longitude: null };
  fieldErrors = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.patientService.getAll().subscribe({
      next: (data: any) => {
        this.patients.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error('Error loading patients');
        this.loading.set(false);
      }
    });
  }

  openCreate() {
    this.dialogMode.set('create');
    this.formModel = { id: null, patientCode: '', firstName: '', lastName: '', age: null, latitude: null, longitude: null };
    this.fieldErrors.set({});
    this.dialogVisible.set(true);
  }

  openEdit(p: Patient) {
    this.dialogMode.set('edit');
    this.formModel = { ...p };
    this.fieldErrors.set({});
    this.dialogVisible.set(true);
  }

  clearFieldError(field: 'patientCode' | 'firstName' | 'lastName') {
    const next = { ...this.fieldErrors() };
    delete next[field];
    this.fieldErrors.set(next);
  }

  save() {
    const patientCode = this.formModel.patientCode?.trim() || '';
    const firstName = this.formModel.firstName?.trim() || '';
    const lastName = this.formModel.lastName?.trim() || '';

    const errors: Record<string, string> = {};
    if (!patientCode) errors['patientCode'] = 'Patient code is required.';
    if (!firstName) errors['firstName'] = 'First name is required.';
    if (!lastName) errors['lastName'] = 'Last name is required.';

    this.fieldErrors.set(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const req = {
      patientCode,
      firstName,
      lastName,
      age: this.formModel.age,
      latitude: this.formModel.latitude,
      longitude: this.formModel.longitude
    };

    const obs = this.dialogMode() === 'create'
      ? this.patientService.create(req)
      : this.patientService.update(this.formModel.id, req);

    obs.subscribe({
      next: () => {
        this.dialogVisible.set(false);
        this.loadData();
        this.success('Patient saved successfully.');
      },
      error: (err) => this.error('Error while saving.')
    });
  }

  delete(id: number) {
    if (confirm('Delete this patient?')) {
      this.patientService.delete(id).subscribe({
        next: () => {
          this.loadData();
          this.success('Patient deleted.');
        },
        error: () => this.error('Error while deleting.')
      });
    }
  }

  private success(msg: string) { this.messageService.add({ severity: 'success', summary: 'Success', detail: msg }); }
  private error(msg: string) { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg }); }
}
