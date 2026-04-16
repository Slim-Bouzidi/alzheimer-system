import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { Textarea } from 'primeng/inputtextarea';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

import {
  DeliveryStatus,
  DeliveryTask,
  DeliveryTaskCreateRequest,
} from '../../../core/models/delivery-task.model';
import { DeliveryTaskService } from '../../../services/delivery-task.service';

type FilterStatus = 'ALL' | DeliveryStatus;

@Component({
  selector: 'app-delivery-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    DropdownModule,
    Textarea,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './delivery-task-list.component.html',
  styleUrl: './delivery-task-list.component.scss',
})
export class DeliveryTaskListComponent implements OnInit {
  private readonly service = inject(DeliveryTaskService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  isMyTasksMode = signal(false);

  tasks = signal<DeliveryTask[]>([]);
  loading = signal(false);

  // Filters
  filterDate: Date | null = null;
  filterStatus: FilterStatus = 'ALL';
  filterPatientCode: string | null = null;
  filterStaffUsername: string | null = null;

  // Dialog state
  dialogVisible = signal(false);
  dialogMode = signal<'create' | 'edit'>('create');
  editingTask = signal<DeliveryTask | null>(null);

  // Simple form model (template-driven for speed)
  formModel = {
    patientCode: '' as string,
    deliveryDate: null as Date | null,
    plannedTime: '' as string, // 'HH:mm'
    assignedStaffUsername: '' as string,
    notes: '' as string,
  };
  fieldErrors = signal<Record<string, string>>({});

  readonly statusOptions = [
    { label: 'All', value: 'ALL' as FilterStatus },
    { label: 'Planned', value: 'PLANNED' as FilterStatus },
    { label: 'Confirmed', value: 'CONFIRMED' as FilterStatus },
    { label: 'Delivered', value: 'DELIVERED' as FilterStatus },
  ];

  get hasFilters(): boolean {
    return (
      !!this.filterDate ||
      !!this.filterPatientCode ||
      !!this.filterStaffUsername ||
      this.filterStatus !== 'ALL'
    );
  }

  ngOnInit(): void {
    this.route.url.subscribe(url => {
      this.isMyTasksMode.set(url.some(segment => segment.path === 'my-tasks'));
      this.loadTasks();
    });
  }

  loadTasks(): void {
    this.loading.set(true);

    let staffUsername = this.filterStaffUsername;
    if (this.isMyTasksMode()) {
      staffUsername = this.authService.username || null;
    }

    // Always load all, then filter client-side for maximum flexibility
    this.service.getAll().subscribe({
      next: (data) => {
        let filtered = data;

        // Filter by patient code
        if (this.filterPatientCode?.trim()) {
          const code = this.filterPatientCode.trim().toLowerCase();
          filtered = filtered.filter(t => t.patientCode?.toLowerCase().includes(code));
        }

        // Filter by staff username
        if (staffUsername?.trim()) {
          const uname = staffUsername.trim().toLowerCase();
          filtered = filtered.filter(t => t.assignedStaffUsername?.toLowerCase().includes(uname));
        }

        // Filter by date
        if (this.filterDate) {
          const dateStr = this.filterDate.toISOString().substring(0, 10);
          filtered = filtered.filter(t => t.deliveryDate === dateStr);
        }

        // Filter by status
        if (this.filterStatus && this.filterStatus !== 'ALL') {
          filtered = filtered.filter(t => t.status === this.filterStatus);
        }

        this.tasks.set(filtered);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading delivery tasks', err);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load delivery tasks.',
        });
      },
    });
  }

  resetFilters(): void {
    this.filterDate = null;
    this.filterStatus = 'ALL';
    this.filterPatientCode = null;
    this.filterStaffUsername = null;
    this.loadTasks();
  }

  // CRUD dialogs
  openCreate(): void {
    this.dialogMode.set('create');
    this.editingTask.set(null);
    this.formModel = {
      patientCode: '',
      deliveryDate: null,
      plannedTime: '',
      assignedStaffUsername: '',
      notes: '',
    };
    this.fieldErrors.set({});
    this.dialogVisible.set(true);
  }

  openEdit(task: DeliveryTask): void {
    this.dialogMode.set('edit');
    this.editingTask.set(task);

    const date = task.deliveryDate ? new Date(task.deliveryDate) : null;
    const time = this.toTimeInput(task.plannedTime);

    this.formModel = {
      patientCode: task.patientCode,
      deliveryDate: date,
      plannedTime: time ?? '',
      assignedStaffUsername: task.assignedStaffUsername ?? '',
      notes: task.notes ?? '',
    };

    this.fieldErrors.set({});
    this.dialogVisible.set(true);
  }

  clearFieldError(field: 'patientCode' | 'deliveryDate' | 'plannedTime'): void {
    const next = { ...this.fieldErrors() };
    delete next[field];
    this.fieldErrors.set(next);
  }

  save(): void {
    const patientCode = this.formModel.patientCode?.trim() || '';
    const plannedTime = this.formModel.plannedTime?.trim() || '';
    const errors: Record<string, string> = {};
    if (!patientCode) {
      errors['patientCode'] = 'Patient code is required.';
    }
    if (!this.formModel.deliveryDate) {
      errors['deliveryDate'] = 'Delivery date is required.';
    }
    if (!plannedTime) {
      errors['plannedTime'] = 'Planned time is required.';
    }

    const hhmmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (plannedTime && !hhmmRegex.test(plannedTime)) {
      errors['plannedTime'] = 'Planned time must be in HH:mm format.';
    }

    this.fieldErrors.set(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = this.buildPayload();
    const mode = this.dialogMode();

    if (mode === 'create') {
      this.service.create(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Created',
            detail: 'Delivery task created successfully.',
          });
          this.dialogVisible.set(false);
          this.loadTasks();
        },
        error: (err) => {
          console.error('Create failed', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create delivery task.',
          });
        },
      });
    } else {
      const task = this.editingTask();
      if (!task) return;
      this.service.update(task.id, payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Delivery task updated successfully.',
          });
          this.dialogVisible.set(false);
          this.loadTasks();
        },
        error: (err) => {
          console.error('Update failed', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update delivery task.',
          });
        },
      });
    }
  }

  confirm(task: DeliveryTask): void {
    this.service.confirm(task.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Confirmed',
          detail: 'Task confirmed.',
        });
        this.loadTasks();
      },
      error: (err) => {
        console.error('Confirm failed', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to confirm task.',
        });
      },
    });
  }

  markDelivered(task: DeliveryTask): void {
    this.service.markDelivered(task.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Delivered',
          detail: 'Task marked as delivered.',
        });
        this.loadTasks();
      },
      error: (err) => {
        console.error('Delivered failed', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to mark task as delivered.',
        });
      },
    });
  }

  delete(task: DeliveryTask): void {
    this.confirmationService.confirm({
      message: `Delete delivery task #${task.id}?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.service.delete(task.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Task deleted.',
            });
            this.loadTasks();
          },
          error: (err) => {
            console.error('Delete failed', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete task.',
            });
          },
        });
      },
    });
  }

  canConfirm(task: DeliveryTask): boolean {
    return !task.status || task.status === 'PLANNED';
  }

  canMarkDelivered(task: DeliveryTask): boolean {
    return task.status === 'CONFIRMED';
  }

  private buildPayload(): DeliveryTaskCreateRequest {
    const dateStr = this.formModel.deliveryDate!
      .toISOString()
      .substring(0, 10);

    let time = this.formModel.plannedTime;
    if (time && time.length === 5) {
      time = `${time}:00`;
    }

    return {
      patientCode: this.formModel.patientCode!.trim(),
      deliveryDate: dateStr,
      plannedTime: time,
      assignedStaffUsername: this.formModel.assignedStaffUsername ? this.formModel.assignedStaffUsername.trim() : null,
      notes: this.formModel.notes || null,
    };
  }

  private toTimeInput(value: string | null | undefined): string | null {
    if (!value) return null;
    const parts = value.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return value;
  }
}


