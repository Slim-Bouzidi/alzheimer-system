<<<<<<< HEAD
import { Component, EventEmitter, HostBinding, Output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
=======
import { Component, EventEmitter, HostBinding, Output, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import keycloak from '../../keycloak';
>>>>>>> cb099be (user ui update)
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
<<<<<<< HEAD
=======
  roles?: string[]; // Optional: only show for these roles
  excludeRoles?: string[]; // Optional: hide for these roles
>>>>>>> cb099be (user ui update)
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

<<<<<<< HEAD
  collapsed = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/', exact: true },
    { label: 'Manage Users', icon: 'pi pi-users', route: '/manage-users', exact: false },
    { label: 'Patients', icon: 'pi pi-users', route: '/patients', exact: false },
    { label: 'Appointments', icon: 'pi pi-calendar', route: '/appointments', exact: false },
    { label: 'Clinical Reports', icon: 'pi pi-file', route: '/clinical-reports', exact: false },
    { label: 'System Settings', icon: 'pi pi-cog', route: '/settings', exact: false },
  ];

  readonly profileMenuItems: MenuItem[] = [
    { label: 'My Profile', icon: 'pi pi-user' },
=======
  collapsed = signal(true);

  private readonly allNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/', exact: true },
    { label: 'Manage Users', icon: 'pi pi-users', route: '/manage-users', exact: false, excludeRoles: ['patient'] },
    { label: 'Patients', icon: 'pi pi-users', route: '/patients', exact: false, excludeRoles: ['patient'] },
    { label: 'Appointments', icon: 'pi pi-calendar', route: '/appointments', exact: false },
    { label: 'Report History', icon: 'pi pi-file', route: '/clinical-reports/history', exact: false, excludeRoles: ['admin'] },
    { label: 'New Clinical Report', icon: 'pi pi-plus-circle', route: '/clinical-reports/new', exact: false, excludeRoles: ['admin'] },
    { label: 'System Settings', icon: 'pi pi-cog', route: '/settings', exact: false, excludeRoles: ['patient'] },
    { label: 'My Workspace', icon: 'pi pi-home', route: '/patient/dashboard', exact: false, roles: ['patient'] },
    { label: 'Profile', icon: 'pi pi-user', route: '/profile', exact: false },
  ];

  // Computed property that filters nav items based on user roles
  readonly navItems = computed(() => {
    return this.allNavItems.filter(item => this.canShowNavItem(item));
  });

  constructor(private router: Router) {}

  readonly profileMenuItems: MenuItem[] = [
    { 
      label: 'My Profile', 
      icon: 'pi pi-user',
      command: () => this.router.navigate(['/profile'])
    },
>>>>>>> cb099be (user ui update)
    { label: 'Account Settings', icon: 'pi pi-cog' },
    { separator: true },
    { 
      label: 'Sign Out', 
      icon: 'pi pi-sign-out',
      command: () => this.onLogout()
    },
  ];

<<<<<<< HEAD
  onLogout(): void {
    import('../../keycloak').then(m => m.default.logout());
=======
  private canShowNavItem(item: NavItem): boolean {
    // Get user roles
    const userRoles = this.getUserRoles();
    
    // If user has no roles, only show basic items (no role restrictions)
    if (userRoles.length === 0) {
      // Users without roles can only see items without role restrictions
      return !item.roles && !item.excludeRoles;
    }

    // If specific roles are required, check if user has any of them
    if (item.roles && item.roles.length > 0) {
      const hasRequiredRole = item.roles.some(role => this.hasRole(role));
      if (!hasRequiredRole) return false;
    }

    // If roles are excluded, check if user has any of them
    if (item.excludeRoles && item.excludeRoles.length > 0) {
      const hasExcludedRole = item.excludeRoles.some(role => this.hasRole(role));
      if (hasExcludedRole) return false;
    }

    return true;
  }

  private getUserRoles(): string[] {
    const roles: string[] = [];
    
    // Keycloak default roles to ignore
    const defaultRoles = ['offline_access', 'uma_authorization', 'default-roles-alzheimer'];
    
    // Get realm roles
    if (keycloak.realmAccess?.roles) {
      const realmRoles = keycloak.realmAccess.roles.filter(role => !defaultRoles.includes(role));
      roles.push(...realmRoles);
    }
    
    // Get resource roles
    if (keycloak.resourceAccess) {
      Object.values(keycloak.resourceAccess).forEach((resource: any) => {
        if (resource.roles) {
          roles.push(...resource.roles);
        }
      });
    }
    
    return roles;
  }

  private hasRole(role: string): boolean {
    return keycloak.hasRealmRole(role) || 
           keycloak.hasResourceRole(role) || 
           keycloak.hasRealmRole(role.toUpperCase()) || 
           keycloak.hasResourceRole(role.toUpperCase()) ||
           keycloak.hasRealmRole(role.toLowerCase()) || 
           keycloak.hasResourceRole(role.toLowerCase());
  }

  onLogout(): void {
    import('../../keycloak').then(m => {
      m.default.logout({
        redirectUri: window.location.origin + '/landing'
      });
    });
>>>>>>> cb099be (user ui update)
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
