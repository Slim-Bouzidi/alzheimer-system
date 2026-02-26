import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MeterGroupModule } from 'primeng/metergroup';
import { ChartModule } from 'primeng/chart';
import { MenuItem, MessageService, ConfirmationService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../core/models/patient.model';

export type UserTab = 'all' | 'patients' | 'caregivers';

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: 'Caregiver' | 'Patient' | 'Staff';
  status: 'Active' | 'Offline';
  lastActivity: string;
  avatar?: string;
  avatarBg?: string;
}

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule, 
    AvatarModule, 
    MenuModule, 
    DialogModule, 
    InputTextModule, 
    InputNumberModule, 
    InputNumberModule, 
    ToastModule,
    ConfirmDialogModule,
    MeterGroupModule,
    ChartModule,
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './manage-users.component.html',
  styleUrl: './manage-users.component.scss',
})
export class ManageUsersComponent implements OnInit {
  private patientService = inject(PatientService);

  readonly activeTab = signal<UserTab>('all');
  readonly first = signal(0);
  readonly rows = signal(10);
  
  // Real patient data from service
  private realPatients = signal<DirectoryUser[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  // Edit User State
  showEditDialog = signal(false);
  isUpdating = signal(false);
  editingUser = signal<Patient | null>(null);

  // Menu items for the action button
  userMenuItems: MenuItem[] = [];
  activeUser: DirectoryUser | null = null;

  // Mock caregivers and staff
  private staticUsers: DirectoryUser[] = [
    {
      id: 'CZ-8921',
      name: 'Eleanor Wright',
      email: 'e.wright@care.com',
      role: 'Caregiver',
      status: 'Active',
      lastActivity: '2 mins ago',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      avatarBg: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'CZ-8923',
      name: 'Sophia Martinez',
      email: 's.martinez@care.com',
      role: 'Caregiver',
      status: 'Offline',
      lastActivity: '1 hour ago',
      avatar: 'https://randomuser.me/api/portraits/women/26.jpg',
      avatarBg: 'bg-purple-100 text-purple-700'
    },
  ];

  // Combined users based on active tab
  readonly users = computed(() => {
    const all = [...this.realPatients(), ...this.staticUsers];
    const tab = this.activeTab();
    
    if (tab === 'patients') {
      return this.realPatients();
    } else if (tab === 'caregivers') {
      return this.staticUsers.filter(u => u.role === 'Caregiver');
    }
    return all;
  });

  readonly totalRecords = computed(() => this.users().length);

  readonly tabs = [
    { id: 'all' as UserTab, label: 'All Users' },
    { id: 'patients' as UserTab, label: 'Patients' },
    { id: 'caregivers' as UserTab, label: 'Caregivers' },
  ];

  readonly stats = computed(() => [
    {
      label: 'Total Users',
      value: (this.realPatients().length + this.staticUsers.length).toLocaleString(),
      trend: '+12%',
      trendUp: true,
      icon: 'pi-users',
      iconBg: 'stat-icon--primary',
    },
    {
      label: 'Active Patients',
      value: this.realPatients().length.toLocaleString(),
      trend: this.realPatients().length > 0 ? '+1' : '0',
      trendUp: this.realPatients().length > 0,
      icon: 'pi-user',
      iconBg: 'stat-icon--orange',
    },
    {
      label: 'Certified Caregivers',
      value: '416',
      trend: '0%',
      trendUp: null,
      icon: 'pi-heart',
      iconBg: 'stat-icon--green',
    },
    {
      label: 'Pending Approvals',
      value: '26',
      trend: '+2',
      trendUp: false,
      icon: 'pi-exclamation-triangle',
      iconBg: 'stat-icon--red',
    },
  ]);

  // Meter Group Data for User Distribution
  readonly meterData = computed(() => [
    { label: 'Patients', color: '#6366f1', value: this.realPatients().length, icon: 'pi pi-user' },
    { label: 'Caregivers', color: '#f59e0b', value: this.staticUsers.length, icon: 'pi pi-heart' },
    { label: 'Staff', color: '#10b981', value: 0, icon: 'pi pi-id-card' }
  ]);

  // Chart Data for Registration Trends
  readonly chartData = computed(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'New Patients',
        data: [12, 19, 3, 5, 2, 3, this.realPatients().length],
        fill: true,
        borderColor: '#6366f1',
        tension: 0.4,
        backgroundColor: 'rgba(99, 102, 241, 0.1)'
      }
    ]
  }));

  readonly chartOptions = {
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        display: true,
        grid: { display: false }
      },
      y: {
        display: false
      }
    },
    maintainAspectRatio: false
  };

  ngOnInit(): void {
    this.loadPatients();
    this.initMenus();

    // Reload when a new patient is added or deleted elsewhere
    this.patientService.refresh$.subscribe(() => {
      this.loadPatients();
    });
  }

  private initMenus(): void {
    this.userMenuItems = [
      {
        label: 'Actions',
        items: [
          {
            label: 'Edit User',
            icon: 'pi pi-user-edit',
            command: () => {
              if (this.activeUser) {
                this.onEditUser(this.activeUser);
              }
            }
          },
          {
            label: 'Delete User',
            icon: 'pi pi-trash',
            className: 'text-red-500',
            command: () => {
              if (this.activeUser) {
                this.confirmDelete(this.activeUser);
              }
            }
          }
        ]
      }
    ];
  }

  loadPatients(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.patientService.getAll().subscribe({
      next: (data: any) => {
        console.log('API Response received:', data);
        const mapped: DirectoryUser[] = (Array.isArray(data) ? data : []).map((p: any, index: number) => ({
          id: p.id ? p.id.toString() : 'Unknown',
          name: `${p.firstName || p.first_name || 'Unknown'} ${p.lastName || p.last_name || ''}`.trim(),
          email: `${p.firstName?.toLowerCase() || 'patient'}.${p.lastName?.toLowerCase() || 'info'}@example.com`,
          role: 'Patient',
          status: 'Active',
          lastActivity: 'Online now',
          avatar: `https://randomuser.me/api/portraits/women/${(index + 32) % 95}.jpg`,
          avatarBg: this.getRandomColor(p.id || index)
        }));
        this.realPatients.set(mapped);
        this.loading.set(false);
        if (mapped.length === 0) {
          this.errorMessage.set('No patients found in the database. Please check your Spring microservice.');
        }
      },
      error: (err: any) => {
        console.error('Patient API Error:', err);
        const msg = err.status === 0 
          ? 'Cannot connect to the patient microservice. Is it running on http://localhost:8080?' 
          : `API Error: ${err.message || 'Unknown error'}`;
        this.errorMessage.set(msg);
        this.loading.set(false);
      }
    });
  }

  readonly total = computed(() => this.totalRecords());

  onTabChange(tab: UserTab): void {
    this.activeTab.set(tab);
    this.first.set(0);
  }

  onFilter(): void {}
  onExport(): void {}

  onEditUser(user: DirectoryUser): void {
    if (user.role !== 'Patient') return; // For now only patients are editable
    
    // Split name back to first and last
    const nameParts = user.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    this.editingUser.set({
      id: parseInt(user.id),
      firstName: firstName,
      lastName: lastName,
      age: 0 // We'd need to fetch full patient details or have age in the DirectoryUser model
    });

    this.showEditDialog.set(true);
  }

  savePatient(): void {
    const user = this.editingUser();
    if (!user || user.id === undefined) return;

    this.isUpdating.set(true);
    this.patientService.update(user.id, user).subscribe({
      next: () => {
        this.messageService.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: 'User updated successfully' 
        });
        this.showEditDialog.set(false);
        this.isUpdating.set(false);
        this.loadPatients(); // Refresh list
      },
      error: (err) => {
        console.error('Update failed:', err);
        this.messageService.add({ 
            severity: 'error', 
            summary: 'Update Failed', 
            detail: 'Could not update user information' 
        });
        this.isUpdating.set(false);
      }
    });
  }

  confirmDelete(user: DirectoryUser): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete <strong>${user.name}</strong>? This action cannot be undone.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => this.deletePatient(user),
    });
  }

  private deletePatient(user: DirectoryUser): void {
    this.patientService.delete(parseInt(user.id)).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: `"${user.name}" has been removed.`
        });
        this.loadPatients();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete user.'
        });
      }
    });
  }

  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  nextPage(): void {
    if (this.first() + this.rows() < this.total()) {
      this.first.update(v => v + this.rows());
    }
  }

  prevPage(): void {
    if (this.first() > 0) {
      this.first.update(v => v - this.rows());
    }
  }

  private getRandomColor(id: number | string): string {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700',
      'bg-amber-100 text-amber-700',
      'bg-emerald-100 text-emerald-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700'
    ];
    const index = typeof id === 'number' ? id % colors.length : id.length % colors.length;
    return colors[index];
  }
}
