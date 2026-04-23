import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { keycloakAuthGuard } from './core/guards/keycloak-auth.guard';
import { roleGuard } from './core/guards/role.guard';

const ADMIN_ROLES = ['ADMIN'];

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    canActivate: [keycloakAuthGuard, roleGuard],
    data: { roles: ADMIN_ROLES },
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
        path: 'delivery-tasks',
        loadComponent: () =>
          import('./features/delivery-tasks/delivery-task-list/delivery-task-list.component').then(
            m => m.DeliveryTaskListComponent
          ),
      },
      {
        path: 'my-tasks',
        loadComponent: () =>
          import('./features/delivery-tasks/delivery-task-list/delivery-task-list.component').then(
            m => m.DeliveryTaskListComponent
          ),
      },
      {
        path: 'staff',
        loadComponent: () =>
          import('./features/staff/staff-list/staff-list.component').then(m => m.StaffListComponent),
      },
      {
        path: 'assignments',
        loadComponent: () =>
          import('./features/assignments/assignment-list/assignment-list.component').then(
            m => m.AssignmentListComponent
          ),
      },
      {
        path: 'shifts',
        loadComponent: () =>
          import('./features/shifts/shift-list/shift-list.component').then(m => m.ShiftListComponent),
      },
      {
        path: 'meal-slots',
        loadComponent: () =>
          import('./features/logistics/meal-slots/meal-slot-list.component').then(
            m => m.MealSlotListComponent
          ),
      },
      {
        path: 'routes',
        loadComponent: () =>
          import('./features/logistics/routes/route-list.component').then(m => m.RouteListComponent),
      },
      {
        path: 'map/:routeId',
        loadComponent: () =>
          import('./features/logistics/route-map/route-map.component').then(m => m.RouteMapComponent),
      },
      {
        path: 'appointments',
        loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        data: { title: 'Appointments', icon: 'pi-calendar' }
      },
      {
        path: 'clinical-reports',
        loadComponent: () =>
          import('./features/clinical-reports/report-list/report-list.component').then(
            m => m.ReportListComponent
          ),
      },
      {
        path: 'clinical-reports/new',
        loadComponent: () =>
          import('./features/clinical-reports/clinical-form/clinical-form.component').then(
            m => m.ClinicalFormComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        data: { title: 'System Settings', icon: 'pi-cog' }
      }
    ],
  },
];
