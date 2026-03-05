import { Component, EventEmitter, HostBinding, Output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import keycloak from '../../keycloak';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Output() toggleCollapse = new EventEmitter<boolean>();
  @HostBinding('class.sidebar-collapsed') get isCollapsed(): boolean {
    return this.collapsed();
  }

  collapsed = signal(true);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/admin', exact: true },
    { label: 'Manage Users', icon: 'pi pi-users', route: '/admin/manage-users', exact: false },
    { label: 'Patients', icon: 'pi pi-users', route: '/admin/patients', exact: false },
    { label: 'Appointments', icon: 'pi pi-calendar', route: '/admin/appointments', exact: false },
    { label: 'Report History', icon: 'pi pi-file', route: '/admin/clinical-reports/history', exact: false },
    { label: 'New Clinical Report', icon: 'pi pi-plus-circle', route: '/admin/clinical-reports/new', exact: false },
    { label: 'Patient Workspace', icon: 'pi pi-home', route: '/admin/patient-dashboard', exact: false },
    { label: 'System Settings', icon: 'pi pi-cog', route: '/admin/settings', exact: false },
  ];

  constructor(private router: Router) {}

  onLogout(): void {
    import('../../keycloak').then(m => m.default.logout());
  }

  toggle(): void {
    this.collapsed.update(v => !v);
    this.toggleCollapse.emit(this.collapsed());
  }

  /** Handles the sidebar toggle button click; prevents any bubbling/layout issues */
  onToggleSidebar(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggle();
  }
}
