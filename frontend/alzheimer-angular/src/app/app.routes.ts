import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'landing',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/registration/registration.component').then(m => m.RegistrationComponent)
  },
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        data: { title: 'Dashboard', icon: 'pi-th-large' }
      },
      {
        path: 'manage-users',
        loadComponent: () =>
          import('./features/manage-users/manage-users.component').then(m => m.ManageUsersComponent),
        canActivate: [roleGuard],
        data: { excludeRoles: ['patient'] }
      },
      {
        path: 'user-types',
        loadComponent: () =>
          import('./features/user-types/user-type-list/user-type-list.component').then(
            m => m.UserTypeListComponent
          ),
        canActivate: [roleGuard],
        data: { excludeRoles: ['patient'] }
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/patients/patient-list/patient-list.component').then(
            m => m.PatientListComponent
          ),
        canActivate: [roleGuard],
        data: { excludeRoles: ['patient'] }
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
            canActivate: [roleGuard],
            data: { title: 'New Report', icon: 'pi-plus', excludeRoles: ['admin'] }
          },
          {
            path: 'history',
            loadComponent: () =>
              import('./features/clinical-reports/report-list/report-list.component').then(m => m.ReportListComponent),
            canActivate: [roleGuard],
            data: { title: 'Report History', icon: 'pi-list', excludeRoles: ['admin'] }
          }
        ]
      },
      {
        path: 'settings',
        loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        canActivate: [roleGuard],
        data: { title: 'System Settings', icon: 'pi-cog', excludeRoles: ['patient'] }
      },
      {
        path: 'patient/dashboard',
        loadComponent: () =>
          import('./features/patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent),
        canActivate: [roleGuard],
        data: { title: 'My Workspace', icon: 'pi-home', roles: ['patient'] }
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
