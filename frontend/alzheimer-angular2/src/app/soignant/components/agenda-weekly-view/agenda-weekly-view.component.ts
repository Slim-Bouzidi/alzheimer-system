import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvenementAgenda, StatutAgenda } from '../../../models/agenda.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-agenda-weekly-view',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './agenda-weekly-view.component.html',
    styleUrls: ['./agenda-weekly-view.component.css']
})
export class AgendaWeeklyViewComponent implements OnChanges {
    @Input() events: EvenementAgenda[] = []; // All events for the week
    @Input() weekStart: Date = new Date();
    @Input() selectedEventId: string | null = null;
    @Output() statusChange = new EventEmitter<{ eventId: string, status: StatutAgenda }>();
    @Output() eventClick = new EventEmitter<EvenementAgenda>();

    weekDays: Date[] = [];
    eventsByDay: { [dateStr: string]: EvenementAgenda[] } = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['weekStart'] || changes['events']) {
            this.generateWeekDays();
            this.groupEventsByDay();
        }
    }

    private generateWeekDays(): void {
        this.weekDays = [];
        const start = new Date(this.weekStart);
        // Ensure we start on Monday if weekStart is not Monday? 
        // For now assume weekStart is correctly passed or just start from it.
        // Let's align to Monday of the weekStart date
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(start.setDate(diff));

        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            this.weekDays.push(d);
        }
    }

    private groupEventsByDay(): void {
        this.eventsByDay = {};
        const dateStrings = this.weekDays.map(d => d.toISOString().slice(0, 10));

        // Initialize buckets
        dateStrings.forEach(ds => this.eventsByDay[ds] = []);

        this.events.forEach(event => {
            const eventDate = new Date(event.date).toISOString().slice(0, 10);
            if (this.eventsByDay[eventDate]) {
                this.eventsByDay[eventDate].push(event);
            }
        });

        // Sort each bucket by time
        Object.keys(this.eventsByDay).forEach(key => {
            this.eventsByDay[key].sort((a, b) => a.heure.localeCompare(b.heure));
        });
    }

    getEventsForDay(date: Date): EvenementAgenda[] {
        return this.eventsByDay[date.toISOString().slice(0, 10)] || [];
    }

    onStatusChange(eventId: string, status: StatutAgenda): void {
        this.statusChange.emit({ eventId, status });
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    onEventClick(event: EvenementAgenda): void {
        this.eventClick.emit(event);
    }
}
