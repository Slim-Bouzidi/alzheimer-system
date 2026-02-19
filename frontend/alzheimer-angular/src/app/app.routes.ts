import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell.component';

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
        loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        data: { title: 'Clinical Reports', icon: 'pi-file' }
      },
      {
        path: 'settings',
        loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        data: { title: 'System Settings', icon: 'pi-cog' }
      }
    ],
  },
];
