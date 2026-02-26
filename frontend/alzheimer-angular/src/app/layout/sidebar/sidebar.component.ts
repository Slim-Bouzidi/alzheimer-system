import { Component, EventEmitter, HostBinding, Output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import keycloak from '../../keycloak';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TooltipModule, AvatarModule, MenuModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Output() toggleCollapse = new EventEmitter<boolean>();
  @HostBinding('class.sidebar-collapsed') get isCollapsed(): boolean {
    return this.collapsed();
  }

  collapsed = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/', exact: true },
    { label: 'Manage Users', icon: 'pi pi-users', route: '/manage-users', exact: false },
    { label: 'Patients', icon: 'pi pi-users', route: '/patients', exact: false },
    { label: 'Appointments', icon: 'pi pi-calendar', route: '/appointments', exact: false },
    { label: 'Report History', icon: 'pi pi-file', route: '/clinical-reports/history', exact: false },
    { label: 'New Clinical Report', icon: 'pi pi-plus-circle', route: '/clinical-reports/new', exact: false },
    { label: 'System Settings', icon: 'pi pi-cog', route: '/settings', exact: false },
    { label: 'My Workspace', icon: 'pi pi-home', route: '/patient/dashboard', exact: false },
  ];

  constructor(private router: Router) {}

  readonly profileMenuItems: MenuItem[] = [
    { 
      label: 'My Profile', 
      icon: 'pi pi-user',
      command: () => this.router.navigate(['/profile'])
    },
    { label: 'Account Settings', icon: 'pi pi-cog' },
    { separator: true },
    { 
      label: 'Sign Out', 
      icon: 'pi pi-sign-out',
      command: () => this.onLogout()
    },
  ];

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
