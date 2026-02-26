import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', redirectTo: 'manage-users', pathMatch: 'full' },
      {
        path: 'manage-users',
        loadComponent: () =>
          import('./features/manage-users/manage-users.component').then(m => m.ManageUsersComponent),
      },
      {
        path: 'user-types',
        loadComponent: () =>
          import('./features/user-types/user-type-list/user-type-list.component').then(
            m => m.UserTypeListComponent
          ),
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/patients/patient-list/patient-list.component').then(
            m => m.PatientListComponent
          ),
      },
      {
        path: 'appointments',
        loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        data: { title: 'Appointments', icon: 'pi-calendar' }
      },
      {
        path: 'clinical-reports',
        children: [
          {
            path: 'new',
            loadComponent: () =>
              import('./features/clinical-reports/clinical-form/clinical-form.component').then(m => m.ClinicalFormComponent),
            data: { title: 'New Report', icon: 'pi-plus' }
          },
          {
            path: 'history',
            loadComponent: () =>
              import('./features/clinical-reports/report-list/report-list.component').then(m => m.ReportListComponent),
            data: { title: 'Report History', icon: 'pi-list' }
          }
        ]
      },
      {
        path: 'settings',
        loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        data: { title: 'System Settings', icon: 'pi-cog' }
      },
      {
        path: 'patient/dashboard',
        loadComponent: () =>
          import('./features/patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent),
        data: { title: 'My Workspace', icon: 'pi-home' }
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent),
        data: { title: 'My Profile', icon: 'pi-user' }
      }
    ],
  },
];
