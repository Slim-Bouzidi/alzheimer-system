import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { UserType, UserTypeFormValue } from '../../../core/models/user-type.model';
import { UserTypeService } from '../../../core/services/user-type.service';
import { UserTypeDialogComponent } from '../user-type-dialog/user-type-dialog.component';

@Component({
  selector: 'app-user-type-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    BadgeModule,
    SkeletonModule,
    TooltipModule,
    InputSwitchModule,
    CardModule,
    DropdownModule,
    IconFieldModule,
    InputIconModule,
    UserTypeDialogComponent,
  ],
  templateUrl: './user-type-list.component.html',
  styleUrl: './user-type-list.component.scss',
})
export class UserTypeListComponent implements OnInit {
  @ViewChild('dt') dt: Table | undefined;

  private readonly userTypeService = inject(UserTypeService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  userTypes = signal<UserType[]>([]);
  loading = signal(true);
  globalFilter = '';

  dialogVisible = signal(false);
  dialogMode = signal<'create' | 'edit'>('create');
  selectedUserType = signal<UserType | null>(null);
  initialCreateData = signal<Partial<UserTypeFormValue> | null>(null);

  skeletonRows = Array(6).fill(null);

  readonly statusOptions = [
    { label: 'All', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  // Map numbers to valid PrimeNG severity strings
  readonly levelSeverityMap: Record<number, 'secondary' | 'info' | 'warning' | 'success' | 'danger'> = {
    1: 'secondary', 2: 'secondary', 3: 'info',
    4: 'info',      5: 'warning',   6: 'warning',
    7: 'success',   8: 'success',   9: 'danger', 10: 'danger',
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.userTypeService.getAll().subscribe({
      next: data => {
        this.userTypes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showError('Failed to load user types');
      },
    });
  }

  openCreate(data: Partial<UserTypeFormValue> | null = null): void {
    this.selectedUserType.set(null);
    this.initialCreateData.set(data);
    this.dialogMode.set('create');
    this.dialogVisible.set(true);
  }

  createNurse(): void {
    this.openCreate({
      name: 'Nurse',
      description: 'Clinical staff with monitoring access',
      level: 6,
      isActive: true
    });
  }

  openEdit(userType: UserType): void {
    this.selectedUserType.set({ ...userType });
    this.dialogMode.set('edit');
    this.dialogVisible.set(true);
  }

  onDialogSaved(saved: UserType): void {
    this.dialogVisible.set(false);
    if (this.dialogMode() === 'create') {
      this.userTypes.update(list => [...list, saved]);
      this.messageService.add({ severity: 'success', summary: 'Created', detail: `"${saved.name}" created successfully.` });
    } else {
      this.userTypes.update(list => list.map(ut => ut.id === saved.id ? saved : ut));
      this.messageService.add({ severity: 'success', summary: 'Updated', detail: `"${saved.name}" updated successfully.` });
    }
  }

  onDialogClosed(): void {
    this.dialogVisible.set(false);
  }

  confirmDelete(userType: UserType): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete <strong>${userType.name}</strong>? This action cannot be undone.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => this.deleteUserType(userType),
    });
  }

  private deleteUserType(userType: UserType): void {
    this.userTypes.update(list => list.filter(ut => ut.id !== userType.id));
    this.userTypeService.delete(userType.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `"${userType.name}" deleted.` });
      },
      error: () => {
        this.userTypes.update(list => [...list, userType]);
        this.showError('Failed to delete user type.');
      },
    });
  }

  onToggleActive(userType: UserType): void {
    const previousState = userType.isActive;
    this.userTypes.update(list =>
      list.map(ut => ut.id === userType.id ? { ...ut, isActive: !ut.isActive } : ut)
    );
    this.userTypeService.toggleActive(userType.id).subscribe({
      next: updated => {
        this.userTypes.update(list => list.map(ut => ut.id === updated.id ? updated : ut));
        const msg = updated.isActive ? 'activated' : 'deactivated';
        this.messageService.add({ severity: 'info', summary: 'Status Updated', detail: `"${updated.name}" ${msg}.` });
      },
      error: () => {
        this.userTypes.update(list =>
          list.map(ut => ut.id === userType.id ? { ...ut, isActive: previousState } : ut)
        );
        this.showError('Failed to update status.');
      },
    });
  }

  // Strictly typed return for Badge severity
  getLevelSeverity(level: number): 'secondary' | 'info' | 'warning' | 'success' | 'danger' {
    return this.levelSeverityMap[level] ?? 'secondary';
  }

  getActiveCount(): number {
    return this.userTypes().filter(ut => ut.isActive).length;
  }

  private showError(message: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }

  onGlobalFilter(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.dt?.filterGlobal(input.value, 'contains');
  }
}
