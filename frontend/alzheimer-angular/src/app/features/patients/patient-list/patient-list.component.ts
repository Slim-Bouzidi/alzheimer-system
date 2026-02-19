import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { PatientService } from '../../../services/patient.service';
import { Patient } from '../../../core/models/patient.model';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, TableModule],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss'
})
export class PatientListComponent implements OnInit {
  private patientService = inject(PatientService);

  patients = signal<Patient[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.patientService.getAll().subscribe({
      next: (data: any) => {
        // The service returns `object`, so we cast to `Patient[]` or check if response structure is `Patient[]` directly.
        // Assuming API returns array directly as per Postman screenshot.
        this.patients.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading patients', err);
        this.loading.set(false);
      }
    });
  }
}
