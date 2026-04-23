import { Component, EventEmitter, HostBinding, Output, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { inject } from '@angular/core';

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
  public authService = inject(AuthService);
  @Output() toggleCollapse = new EventEmitter<boolean>();
  @HostBinding('class.sidebar-collapsed') get isCollapsed(): boolean {
    return this.collapsed();
  }

  collapsed = signal(false);

  readonly navItems = computed(() => {
    const items: NavItem[] = [
      { label: 'Dashboard', icon: 'pi pi-th-large', route: '/', exact: true },
    ];

    if (this.authService.isAdmin()) {
      items.push({ label: 'Manage Users', icon: 'pi pi-users', route: '/manage-users', exact: false });
    }

    items.push({ label: 'Patients', icon: 'pi pi-heart', route: '/patients', exact: false });

    if (this.authService.isStaff()) {
      items.push({ label: 'My Tasks', icon: 'pi pi-truck', route: '/my-tasks', exact: false });
    } else {
      items.push({ label: 'Delivery Tasks', icon: 'pi pi-truck', route: '/delivery-tasks', exact: false });
    }

    // Staff & HR section — visible to admins and managers
    items.push({ label: 'Staff', icon: 'pi pi-id-card', route: '/staff', exact: false });
    items.push({ label: 'Assignments', icon: 'pi pi-link', route: '/assignments', exact: false });
    items.push({ label: 'Shifts', icon: 'pi pi-clock', route: '/shifts', exact: false });

    // Logistics section
    items.push({ label: 'Meal Slots', icon: 'pi pi-calendar-plus', route: '/meal-slots', exact: false });
    items.push({ label: 'Routes', icon: 'pi pi-map', route: '/routes', exact: false });

    items.push({ label: 'Appointments', icon: 'pi pi-calendar', route: '/appointments', exact: false });
    items.push({ label: 'Clinical Reports', icon: 'pi pi-file', route: '/clinical-reports', exact: false });

    if (this.authService.isAdmin()) {
      items.push({ label: 'System Settings', icon: 'pi pi-cog', route: '/settings', exact: false });
    }

    return items;
  });

  readonly profileMenuItems: MenuItem[] = [
    { label: 'My Profile', icon: 'pi pi-user' },
    { label: 'Account Settings', icon: 'pi pi-cog' },
    { separator: true },
    {
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      command: () => this.onLogout()
    },
  ];

  onLogout(): void {
    void this.authService.logout();
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
