import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SoignantService } from '../soignant.service';
import { EvenementAgenda, StatutAgenda } from '../../models/agenda.model';
import { PatientSoignant } from '../../models/patient-soignant.model';
import { AgendaDailyViewComponent } from '../components/agenda-daily-view/agenda-daily-view.component';
import { AgendaWeeklyViewComponent } from '../components/agenda-weekly-view/agenda-weekly-view.component';
import { PatientTrackingPanelComponent } from '../components/patient-tracking-panel/patient-tracking-panel.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-soignant-agenda-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, AgendaDailyViewComponent, AgendaWeeklyViewComponent, PatientTrackingPanelComponent],
  templateUrl: './soignant-agenda-page.component.html',
  styleUrls: ['./soignant-agenda-page.component.css']
})
export class SoignantAgendaPageComponent implements OnInit, OnDestroy {
  currentView: 'week' | 'day' = 'week';
  currentDate: Date = new Date();
  events: EvenementAgenda[] = [];

  // Patient panel and filtering properties
  patients: PatientSoignant[] = [];
  agendaFilterPatientId: string | null = null;
  selectedPatientId: string | null = null;
  selectedEventId: string | null = null;
  isPanelOpen: boolean = false;

  private sub: Subscription = new Subscription();

  constructor(private soignantService: SoignantService, private translate: TranslateService) { }

  ngOnInit(): void {
    this.patients = this.soignantService.getPatientsAssignes();
    // In a real app, we might fetch based on date range.
    // Here we get all events and filter in the components or service.
    this.refreshEvents();

    // Auto-refresh every minute to check for "late" status updates? 
    // Or relying on service to push updates.
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  refreshEvents(): void {
    let allEvents = this.soignantService.getEvenementsSemaine();
    if (this.agendaFilterPatientId) {
      this.events = allEvents.filter(e => e.patientId === this.agendaFilterPatientId);
    } else {
      this.events = allEvents;
    }
  }

  filterByPatient(id: string | null): void {
    this.agendaFilterPatientId = id;
    this.refreshEvents();
  }

  onStatusChange(event: { eventId: string, status: StatutAgenda }): void {
    this.soignantService.marquerEvenementStatut(event.eventId, event.status).subscribe(() => {
      this.refreshEvents();
    });
  }

  switchView(view: 'week' | 'day'): void {
    this.currentView = view;
  }

  previous(): void {
    if (this.currentView === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() - 7);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() - 1);
    }
    this.currentDate = new Date(this.currentDate); // trigger change detection if input relies on ref
  }

  next(): void {
    if (this.currentView === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() + 1);
    }
    this.currentDate = new Date(this.currentDate);
  }

  get currentPeriodLabel(): string {
    // Simple label logic
    if (this.currentView === 'day') {
      return this.currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    } else {
      const start = new Date(this.currentDate); // approximate logic for week start label
      // Logic to find monday
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(start.setDate(diff));
      return this.translate.instant('SOIGNANT.WEEK_OF') + ' ' + monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    }
  }

  /**
   * Handle event click to select patient and open panel
   */
  onEventClick(event: EvenementAgenda): void {
    this.selectedPatientId = event.patientId;
    this.selectedEventId = event.id;
    this.isPanelOpen = true; // For tablet drawer mode
  }

  /**
   * Close panel drawer (for tablet/mobile)
   */
  closePanelDrawer(): void {
    this.isPanelOpen = false;
  }
}
