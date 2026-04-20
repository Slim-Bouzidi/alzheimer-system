import { inject } from '@angular/core';
import { Router, Routes, UrlTree } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { roleGuard } from './core/guards/role.guard';
import keycloak from './keycloak';

type KeycloakResourceAccessEntry = { roles?: string[] };

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
    path: 'doctor-dashboard',
    loadComponent: () => import('./features/alzheimer-app/doctor-portal/doctor-dashboard.component').then(m => m.DoctorDashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'doctor-patients',
    loadComponent: () => import('./features/alzheimer-app/doctor-portal/doctor-patients.component')
      .then(m => m.DoctorPatientsComponent)
      .catch(() => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)),
    canActivate: [roleGuard],
    data: { roles: ['DOCTOR', 'ADMIN'] }
  },
  {
    path: 'doctor-appointments',
    loadComponent: () => import('./features/alzheimer-app/doctor-portal/doctor-appointments.component')
      .then(m => m.DoctorAppointmentsComponent)
      .catch(() => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)),
    canActivate: [roleGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'doctor-reports',
    loadComponent: () => import('./features/alzheimer-app/doctor-portal/doctor-reports.component')
      .then(m => m.DoctorReportsComponent)
      .catch(() => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)),
    canActivate: [roleGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'doctor-report-create',
    loadComponent: () => import('./features/alzheimer-app/doctor-portal/doctor-report-create.component').then(m => m.DoctorReportCreateComponent),
    canActivate: [roleGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'doctor-settings',
    loadComponent: () => import('./features/alzheimer-app/doctor-portal/doctor-settings.component').then(m => m.DoctorSettingsComponent),
    canActivate: [roleGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'doctor-articles',
    loadComponent: () => import('./features/alzheimer-app/doctor-portal/doctor-articles.component').then(m => m.DoctorArticlesComponent),
    canActivate: [roleGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'doctor-alerts',
    loadComponent: () => import('./features/alzheimer-app/doctor-portal/doctor-alerts.component').then(m => m.DoctorAlertsComponent),
    canActivate: [roleGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [(): boolean | UrlTree => {
      const router = inject(Router);
      const realmRoles = keycloak.realmAccess?.roles || [];
      const resourceRoles = Object.values(keycloak.resourceAccess || {})
        .flatMap((resource) => (resource as KeycloakResourceAccessEntry).roles || []);
      const tokenRoles =
        (keycloak.tokenParsed && 'roles' in keycloak.tokenParsed
          ? (keycloak.tokenParsed['roles'] as string[] | undefined)
          : []) || [];

      const allRoles = [...realmRoles, ...resourceRoles, ...tokenRoles].map(r => r.toUpperCase());

      if (allRoles.some(r => r.includes('DOCTOR') || r.includes('DOCTEUR'))) {
        return router.createUrlTree(['/doctor-dashboard']);
      }
      return true;
    }],
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
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'user-types',
        loadComponent: () =>
          import('./features/user-types/user-type-list/user-type-list.component').then(
            m => m.UserTypeListComponent
          ),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/patients/patient-list/patient-list.component').then(
            m => m.PatientListComponent
          ),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DOCTOR'] }
      },
      {
        path: 'appointments',
        loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DOCTOR', 'CAREGIVER'], title: 'Appointments', icon: 'pi-calendar' }
      },
      {
        path: 'clinical-reports',
        children: [
          {
            path: 'new',
            loadComponent: () =>
              import('./features/clinical-reports/clinical-form/clinical-form.component').then(m => m.ClinicalFormComponent),
            canActivate: [roleGuard],
            data: { title: 'New Report', icon: 'pi-plus', roles: ['DOCTOR', 'CAREGIVER', 'PATIENT'] }
          },
          {
            path: 'history',
            loadComponent: () =>
              import('./features/clinical-reports/report-list/report-list.component').then(m => m.ReportListComponent),
            canActivate: [roleGuard],
            data: { title: 'Report History', icon: 'pi-list', roles: ['DOCTOR', 'CAREGIVER', 'ADMIN', 'PATIENT'] }
          }
        ]
      },
      {
        path: 'settings',
        loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        canActivate: [roleGuard],
        data: { title: 'System Settings', icon: 'pi-cog', roles: ['ADMIN'] }
      },
      {
        path: 'patient/dashboard',
        loadComponent: () =>
          import('./features/patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent),
        canActivate: [roleGuard],
        data: { title: 'My Workspace', icon: 'pi-home', roles: ['PATIENT'] }
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
