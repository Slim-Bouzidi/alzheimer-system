import { Component, Input, OnDestroy, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { WebSocketService } from '../../services/websocket.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnChanges, OnDestroy {
  @Input() role: string = 'SOIGNANT';
  @Input() userName: string = 'Dr. Marie Martin';
  @Input() userRole: string = 'Médecin Chef';

  /** Badges pour le rôle SOIGNANT */
  @Input() alertesCount: number = 0;
  @Input() rapportsNonLusCount: number = 0;
  @Input() rapportHebdoNonEnvoye: boolean = false;
  /** Legacy mock badge from layout (soignant.service); do not mutate from child code. */
  @Input() notificationsCount: number = 0;
  @Input() suiviRempliAujourdhui: boolean = false;

  /** Unread count from support-network API + live WS bumps (never overwrites @Input above). */
  supportNetworkUnreadBadge = 0;

  /** Footer notification badge; updated explicitly (not a template getter) to avoid dev-mode CD issues. */
  footerNotificationBadge = 0;

  menuItems: { label: string; icon: string; route: string }[] = [];
  rappelsMenuOpen = false;
  networkMenuOpen = false;
  private wsSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;
  private deferredInitId: ReturnType<typeof setTimeout> | null = null;
  private selectedMemberId: number | null = this.readSelectedMemberId();
  private readonly authService = inject(AuthService);

  constructor(
    private router: Router,
    private websocketService: WebSocketService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.updateMenu();
    this.syncFooterBadge();
    this.rappelsMenuOpen = /\/soignant-rappels/.test(this.router.url);
    this.networkMenuOpen = /\/soignant-dashboard\/network\//.test(this.router.url);
    if (this.supportsRealtimeNotifications()) {
      this.deferredInitId = setTimeout(() => {
        this.deferredInitId = null;
        this.refreshUnreadCount();
      }, 0);
    }

    this.routerSubscription = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.selectedMemberId = this.readSelectedMemberId();
        this.rappelsMenuOpen = /\/soignant-rappels/.test(this.router.url);
        this.networkMenuOpen = /\/soignant-dashboard\/network\//.test(this.router.url);
        if (/\/soignant-notifications(\/|$)/.test(this.router.url)) {
          this.supportNetworkUnreadBadge = 0;
        }
        if (this.supportsRealtimeNotifications()) {
          this.refreshUnreadCount();
        } else {
          this.supportNetworkUnreadBadge = 0;
        }
        this.syncFooterBadge();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['role']) {
      this.updateMenu();
    }
    if (changes['notificationsCount']) {
      this.syncFooterBadge();
    }
  }

  ngOnDestroy(): void {
    if (this.deferredInitId != null) {
      clearTimeout(this.deferredInitId);
      this.deferredInitId = null;
    }
    this.wsSubscription?.unsubscribe();
    this.wsSubscription = null;
    this.routerSubscription?.unsubscribe();
    this.routerSubscription = null;
  }

  private syncFooterBadge(): void {
    if (/\/soignant-notifications(\/|$)/.test(this.router.url)) {
      this.footerNotificationBadge = 0;
      return;
    }
    this.footerNotificationBadge = Math.max(this.supportNetworkUnreadBadge, this.notificationsCount);
  }

  toggleRappelsMenu(): void {
    this.rappelsMenuOpen = !this.rappelsMenuOpen;
  }

  toggleNetworkMenu(): void {
    this.networkMenuOpen = !this.networkMenuOpen;
  }

  getBadgeCount(route: string): number {
    if (this.role !== 'SOIGNANT') return 0;
    if (route === '/soignant-rapports') return this.rapportsNonLusCount;
    return 0;
  }

  getBadgeType(route: string): 'default' | 'blue' | 'orange' {
    if (route === '/soignant-rapports') return 'blue';
    if (route === '/soignant-rapports-hebdo') return 'orange';
    return 'default';
  }

  getBadgeDot(route: string): boolean {
    if (this.role !== 'SOIGNANT') return false;
    if (route === '/soignant-suivi') return !this.suiviRempliAujourdhui;
    if (route === '/soignant-rapports-hebdo') return this.rapportHebdoNonEnvoye;
    return false;
  }

  get displayName(): string {
    return this.authService.getDisplayName(this.isDoctorMenu()) || this.userName;
  }

  get displayRole(): string {
    return this.authService.getRoleDisplayName() || this.userRole;
  }

  updateMenu() {
    switch (this.role) {
      case 'SOIGNANT':
        this.menuItems = [
          { label: 'SIDEBAR.HOME', icon: 'pi pi-home', route: '/soignant-dashboard' },
          { label: 'SIDEBAR.MY_PATIENTS', icon: 'pi pi-users', route: '/soignant-patients' },
          { label: 'SIDEBAR.MEDICAL_REPORTS', icon: 'pi pi-file', route: '/soignant-rapports' },
          { label: 'SIDEBAR.DAILY_MONITORING', icon: 'pi pi-clipboard', route: '/soignant-suivi' },
          { label: 'SIDEBAR.VISUAL_AGENDA', icon: 'pi pi-calendar', route: '/soignant-agenda' },
          { label: 'SIDEBAR.WEEKLY_REPORTS', icon: 'pi pi-chart-line', route: '/soignant-rapports-hebdo' },
        ];
        break;
      case 'PATIENT':
        this.menuItems = [
          { label: 'SIDEBAR.MY_HEALTH', icon: 'pi pi-home', route: '/patient-dashboard' },
          { label: 'SIDEBAR.APPOINTMENTS', icon: 'pi pi-calendar', route: '/patient-appointments' },
          { label: 'SIDEBAR.MEDICATIONS', icon: 'pi pi-heart', route: '/patient-medications' },
          { label: 'SIDEBAR.EXERCISES', icon: 'pi pi-bolt', route: '/patient-exercises' },
          { label: 'SIDEBAR.EMERGENCIES', icon: 'pi pi-bell', route: '/patient-emergency' }
        ];
        break;
      case 'AIDANT':
      case 'CAREGIVER':
        this.menuItems = [
          { label: 'SIDEBAR.DASHBOARD', icon: 'pi pi-th-large', route: '/caregiver-dashboard' },
          { label: 'SIDEBAR.MY_PATIENTS', icon: 'pi pi-users', route: '/caregiver-patients' },
          { label: 'SIDEBAR.PLANNING', icon: 'pi pi-calendar', route: '/caregiver-appointments' },
          { label: 'SIDEBAR.REPORTS', icon: 'pi pi-file', route: '/caregiver-reports' },
          { label: 'SIDEBAR.RESOURCES', icon: 'pi pi-book', route: '/caregiver-resources' }
        ];
        break;
      case 'LIVREUR':
        this.menuItems = [
          { label: 'SIDEBAR.DASHBOARD', icon: 'pi pi-th-large', route: '/livreur-dashboard' },
          { label: 'SIDEBAR.DELIVERY_TASKS', icon: 'pi pi-box', route: '/delivery-tasks' },
          { label: 'SIDEBAR.STAFF', icon: 'pi pi-users', route: '/staff' },
          { label: 'SIDEBAR.ASSIGNMENTS', icon: 'pi pi-directions-alt', route: '/assignments' },
          { label: 'SIDEBAR.SHIFTS', icon: 'pi pi-clock', route: '/shifts' },
          { label: 'SIDEBAR.MEAL_SLOTS', icon: 'pi pi-calendar-clock', route: '/meal-slots' },
          { label: 'SIDEBAR.ROUTES', icon: 'pi pi-map', route: '/routes' }
        ];
        break;
      case 'DOCTEUR':
      case 'DOCTOR':
        this.menuItems = [
          { label: 'SIDEBAR.OVERVIEW', icon: 'pi pi-th-large', route: '/doctor-dashboard' },
          { label: 'SIDEBAR.MY_PATIENTS', icon: 'pi pi-users', route: '/doctor-patients' },
          { label: 'SIDEBAR.APPOINTMENTS', icon: 'pi pi-calendar', route: '/doctor-appointments' },
          { label: 'SIDEBAR.REPORTS_ASSESSMENTS', icon: 'pi pi-file', route: '/doctor-reports' },
          { label: 'SIDEBAR.CREATE_FOLLOW_UP_REPORT', icon: 'pi pi-file-edit', route: '/doctor-report-create' },
          { label: 'SIDEBAR.ALERTS', icon: 'pi pi-bell', route: '/doctor-alerts' },
          { label: 'SIDEBAR.SETTINGS', icon: 'pi pi-cog', route: '/doctor-settings' }
        ];
        break;
      case 'ADMIN':
        this.menuItems = [
          { label: 'SIDEBAR.DASHBOARD', icon: 'pi pi-th-large', route: '/admin-dashboard' },
          { label: 'SIDEBAR.USER_MANAGEMENT', icon: 'pi pi-users', route: '/admin-users' },
          { label: 'SIDEBAR.SYSTEM_SETTINGS', icon: 'pi pi-cog', route: '/admin-settings' },
          { label: 'SIDEBAR.STAFF', icon: 'pi pi-id-card', route: '/staff' },
          { label: 'SIDEBAR.ROUTES', icon: 'pi pi-map', route: '/routes' }
        ];
        break;
      default:
        this.menuItems = [];
        break;
    }
  }

  private refreshUnreadCount(): void {
    if (!this.supportsRealtimeNotifications() || this.selectedMemberId == null) {
      this.supportNetworkUnreadBadge = 0;
      this.syncFooterBadge();
      return;
    }
    this.notificationService.getUnreadCount(this.selectedMemberId).subscribe({
      next: (res) => {
        this.supportNetworkUnreadBadge = Number(res.unreadCount ?? 0);
        this.ensureRealtimeSubscription();
        this.syncFooterBadge();
      },
      error: () => {
        this.supportNetworkUnreadBadge = 0;
        this.syncFooterBadge();
      },
    });
  }

  private ensureRealtimeSubscription(): void {
    if (this.selectedMemberId == null || this.wsSubscription) {
      return;
    }

    this.websocketService.watchNotifications(this.selectedMemberId);
    this.wsSubscription = this.websocketService.onNotification().subscribe((event) => {
      const memberId =
        event && typeof event === 'object' && 'memberId' in (event as Record<string, unknown>)
          ? Number((event as Record<string, unknown>)['memberId'])
          : null;
      if (memberId == null || memberId !== this.selectedMemberId) {
        return;
      }
      this.supportNetworkUnreadBadge++;
      this.syncFooterBadge();
    });
  }

  private readSelectedMemberId(): number | null {
    const rawValue = localStorage.getItem('supportNetwork.selectedMemberId');
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private supportsRealtimeNotifications(): boolean {
    return ['SOIGNANT', 'CAREGIVER', 'AIDANT'].includes(this.role);
  }

  private isDoctorMenu(): boolean {
    return this.role === 'DOCTEUR' || this.role === 'DOCTOR' || this.authService.isDoctor();
  }
}
