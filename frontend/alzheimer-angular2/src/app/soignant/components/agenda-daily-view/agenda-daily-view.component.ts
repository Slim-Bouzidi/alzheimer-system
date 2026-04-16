import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvenementAgenda, StatutAgenda } from '../../../models/agenda.model';
import { AgendaEventCardComponent } from '../agenda-event-card/agenda-event-card.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-agenda-daily-view',
    standalone: true,
    imports: [CommonModule, AgendaEventCardComponent, TranslateModule],
    templateUrl: './agenda-daily-view.component.html',
    styleUrls: ['./agenda-daily-view.component.css']
})
export class AgendaDailyViewComponent {
    @Input() events: EvenementAgenda[] = [];
    @Input() selectedEventId: string | null = null;
    @Output() statusChange = new EventEmitter<{ eventId: string, status: StatutAgenda }>();
    @Output() eventClick = new EventEmitter<EvenementAgenda>();

    get sortedEvents(): EvenementAgenda[] {
        return [...this.events].sort((a, b) => a.heure.localeCompare(b.heure));
    }

    onStatusChange(eventId: string, status: StatutAgenda): void {
        this.statusChange.emit({ eventId, status });
    }

    // Helper to group events by hour if needed, but simple list is fine for now

    onEventClick(event: EvenementAgenda): void {
        this.eventClick.emit(event);
    }
}
