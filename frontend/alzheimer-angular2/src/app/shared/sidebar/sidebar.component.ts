import { Component, Input, OnDestroy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { WebSocketService } from '../../services/websocket.service';
import { NotificationService } from '../../services/notification.service';

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
  private selectedMemberId = Number(localStorage.getItem('supportNetwork.selectedMemberId') ?? '2');

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
    // Defer WS + HTTP so first paint / layout never blocks on backend or SockJS.
    this.deferredInitId = setTimeout(() => {
      this.deferredInitId = null;
      this.refreshUnreadCount();
      this.websocketService.watchNotifications(this.selectedMemberId);
      this.wsSubscription = this.websocketService.onNotification().subscribe((event) => {
        console.log('📩 WS message received:', event);
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
    }, 0);

    this.routerSubscription = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.selectedMemberId = Number(localStorage.getItem('supportNetwork.selectedMemberId') ?? '2');
        this.rappelsMenuOpen = /\/soignant-rappels/.test(this.router.url);
        this.networkMenuOpen = /\/soignant-dashboard\/network\//.test(this.router.url);
        if (/\/soignant-notifications(\/|$)/.test(this.router.url)) {
          this.supportNetworkUnreadBadge = 0;
        }
        this.refreshUnreadCount();
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

  updateMenu() {
    switch (this.role) {
      case 'SOIGNANT':
        this.menuItems = [
          { label: 'SIDEBAR.HOME', icon: '🏠', route: '/soignant-dashboard' },
          { label: 'SIDEBAR.MY_PATIENTS', icon: '👥', route: '/soignant-patients' },
          { label: 'SIDEBAR.MEDICAL_REPORTS', icon: '📨', route: '/soignant-rapports' },
          { label: 'SIDEBAR.DAILY_MONITORING', icon: '📝', route: '/soignant-suivi' },
          { label: 'SIDEBAR.VISUAL_AGENDA', icon: '📅', route: '/soignant-agenda' },
          { label: 'SIDEBAR.WEEKLY_REPORTS', icon: '📊', route: '/soignant-rapports-hebdo' },
        ];
        break;
      case 'PATIENT':
        this.menuItems = [
          { label: 'SIDEBAR.MY_HEALTH', icon: '❤️', route: '/patient-dashboard' },
          { label: 'SIDEBAR.APPOINTMENTS', icon: '📅', route: '/patient-appointments' },
          { label: 'SIDEBAR.MEDICATIONS', icon: '💊', route: '/patient-medications' },
          { label: 'SIDEBAR.EXERCISES', icon: '🧘', route: '/patient-exercises' },
          { label: 'SIDEBAR.EMERGENCIES', icon: '🚨', route: '/patient-emergency' }
        ];
        break;
      case 'AIDANT':
        this.menuItems = [
          { label: 'SIDEBAR.DASHBOARD', icon: '📊', route: '/caregiver-dashboard' },
          { label: 'SIDEBAR.MY_PATIENTS', icon: '👥', route: '/caregiver-patients' },
          { label: 'SIDEBAR.PLANNING', icon: '📅', route: '/caregiver-appointments' },
          { label: 'SIDEBAR.REPORTS', icon: '📝', route: '/caregiver-reports' },
          { label: 'SIDEBAR.RESOURCES', icon: '📚', route: '/caregiver-resources' }
        ];
        break;
      case 'DOCTEUR':
        this.menuItems = [
          { label: 'SIDEBAR.OVERVIEW', icon: '🩺', route: '/doctor-dashboard' },
          { label: 'SIDEBAR.MY_PATIENTS', icon: '👥', route: '/doctor-patients' },
          { label: 'SIDEBAR.APPOINTMENTS', icon: '📅', route: '/doctor-appointments' },
          { label: 'SIDEBAR.REPORTS_ASSESSMENTS', icon: '📝', route: '/doctor-reports' },
          { label: 'SIDEBAR.CREATE_FOLLOW_UP_REPORT', icon: '📋', route: '/doctor-report-create' },
          { label: 'SIDEBAR.SETTINGS', icon: '⚙️', route: '/doctor-settings' }
        ];
        break;
      default:
        this.menuItems = [];
        break;
    }
  }

  private refreshUnreadCount(): void {
    if (!Number.isFinite(this.selectedMemberId) || this.selectedMemberId <= 0) {
      this.supportNetworkUnreadBadge = 0;
      this.syncFooterBadge();
      return;
    }
    this.notificationService.getUnreadCount(this.selectedMemberId).subscribe({
      next: (res) => {
        this.supportNetworkUnreadBadge = Number(res.unreadCount ?? 0);
        this.syncFooterBadge();
      },
      error: () => {
        this.supportNetworkUnreadBadge = 0;
        this.syncFooterBadge();
      },
    });
  }
}
