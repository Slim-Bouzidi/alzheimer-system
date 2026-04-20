import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateFallbackPipe } from '../pipes/translate-fallback.pipe';

@Component({
  selector: 'app-sidebar-portal',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, TranslateFallbackPipe],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnChanges, OnDestroy {
  @Input() role: string = 'SOIGNANT';
  @Input() userName: string = 'Dr. Marie Martin';
  @Input() userRole: string = 'Médecin Chef';

  @Input() alertesCount: number = 0;
  @Input() rapportsNonLusCount: number = 0;
  @Input() rapportHebdoNonEnvoye: boolean = false;
  @Input() notificationsCount: number = 0;
  @Input() suiviRempliAujourdhui: boolean = false;

  menuItems: { label: string; icon: string; route: string }[] = [];
  rappelsMenuOpen = false;
  private readonly destroy$ = new Subject<void>();

  constructor(private router: Router) {}

  ngOnInit() {
    this.updateMenu();
    this.rappelsMenuOpen = /\/soignant-rappels/.test(this.router.url);
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.rappelsMenuOpen = /\/soignant-rappels/.test(this.router.url);
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['role']) {
      this.updateMenu();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
          { label: 'Home', icon: 'pi pi-home', route: '/soignant-dashboard' },
          { label: 'My Patients', icon: 'pi pi-users', route: '/soignant-patients' },
          { label: 'Medical Reports', icon: 'pi pi-inbox', route: '/soignant-rapports' },
          { label: 'Daily Monitoring', icon: 'pi pi-file-edit', route: '/soignant-suivi' },
          { label: 'Visual Agenda', icon: 'pi pi-calendar', route: '/soignant-agenda' },
          { label: 'Weekly Reports', icon: 'pi pi-chart-line', route: '/soignant-rapports-hebdo' },
        ];
        break;
      case 'PATIENT':
        this.menuItems = [
          { label: 'My Health', icon: 'pi pi-heart', route: '/patient-dashboard' },
          { label: 'Appointments', icon: 'pi pi-calendar', route: '/patient-appointments' },
          { label: 'Medications', icon: 'pi pi-tablet', route: '/patient-medications' },
          { label: 'Exercises', icon: 'pi pi-bolt', route: '/patient-exercises' },
          { label: 'Emergencies', icon: 'pi pi-exclamation-triangle', route: '/patient-emergency' }
        ];
        break;
      case 'AIDANT':
        this.menuItems = [
          { label: 'Dashboard', icon: 'pi pi-th-large', route: '/caregiver-dashboard' },
          { label: 'My Patients', icon: 'pi pi-users', route: '/caregiver-patients' },
          { label: 'Planning', icon: 'pi pi-calendar', route: '/caregiver-appointments' },
          { label: 'Reports', icon: 'pi pi-file', route: '/caregiver-reports' },
          { label: 'Resources', icon: 'pi pi-book', route: '/caregiver-resources' }
        ];
        break;
      case 'DOCTOR':
      case 'DOCTEUR':
        this.menuItems = [
          { label: 'Overview', icon: 'pi pi-th-large', route: '/doctor-dashboard' },
          { label: 'My Patients', icon: 'pi pi-users', route: '/doctor-patients' },
          { label: 'Appointments', icon: 'pi pi-calendar', route: '/doctor-appointments' },
          { label: 'Reports Assessments', icon: 'pi pi-file', route: '/doctor-reports' },
          { label: 'Create Follow Up Report', icon: 'pi pi-file-edit', route: '/doctor-report-create' },
          { label: 'Alerts', icon: 'pi pi-bell', route: '/doctor-alerts' },
          { label: 'Settings', icon: 'pi pi-cog', route: '/doctor-settings' }
        ];
        break;
      default:
        this.menuItems = [];
        break;
    }
  }
}
