import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslateFallbackPipe } from '../pipes/translate-fallback.pipe';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateFallbackPipe],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnChanges {
  @Input() role: string = 'SOIGNANT';
  @Input() userName: string = 'Dr. Marie Martin';
  @Input() userRole: string = 'Médecin Chef';

  /** Badges pour le rôle SOIGNANT */
  @Input() alertesCount: number = 0;
  @Input() rapportsNonLusCount: number = 0;
  @Input() rapportHebdoNonEnvoye: boolean = false;
  @Input() notificationsCount: number = 0;
  @Input() suiviRempliAujourdhui: boolean = false;

  menuItems: { label: string; icon: string; route: string }[] = [];
  rappelsMenuOpen = false;

  constructor(private router: Router) { }

  ngOnInit() {
    this.updateMenu();
    this.rappelsMenuOpen = /\/soignant-rappels/.test(this.router.url);
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      this.rappelsMenuOpen = /\/soignant-rappels/.test(this.router.url);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['role']) {
      this.updateMenu();
    }
  }

  toggleRappelsMenu(): void {
    this.rappelsMenuOpen = !this.rappelsMenuOpen;
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
          { label: 'SIDEBAR.ARTICLES', icon: '📚', route: '/doctor-articles' },
          { label: 'SIDEBAR.SETTINGS', icon: '⚙️', route: '/doctor-settings' }
        ];
        break;
      case 'LIVREUR':
        this.menuItems = [
          { label: 'Delivery Tasks', icon: '🚚', route: '/delivery-tasks' },
          { label: 'Staff', icon: '🪪', route: '/staff' },
          { label: 'Assignments', icon: '🔗', route: '/assignments' },
          { label: 'Shifts', icon: '🕒', route: '/shifts' },
          { label: 'Meal Slots', icon: '🍽️', route: '/meal-slots' },
          { label: 'Routes', icon: '🗺️', route: '/routes' },
          { label: 'Appointments', icon: '📅', route: '/my-tasks' }
        ];
        break;
      default:
        this.menuItems = [];
        break;
    }
  }
}
