import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvenementAgenda, StatutAgenda } from '../../../models/agenda.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-agenda-event-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './agenda-event-card.component.html',
  styleUrl: './agenda-event-card.component.css'
})
export class AgendaEventCardComponent {
  @Input() event!: EvenementAgenda;
  @Output() statusChange = new EventEmitter<StatutAgenda>();

  get icon(): string {
    switch (this.event.type) {
      case 'medicament': return '💊';
      case 'repas': return '🍽️';
      case 'rendez_vous': return 'cal_event'; // material icon
      case 'activite': return 'directions_run'; // material icon
      default: return 'event';
    }
  }

  get isLate(): boolean {
    // Check if already done
    const statutFait: StatutAgenda = 'fait';
    if (this.event.statut === statutFait) return false;

    // Simple check: if event is today and time is passed
    const now = new Date();
    const eventTime = new Date(this.event.date);
    const [hours, minutes] = this.event.heure.split(':').map(Number);
    eventTime.setHours(hours, minutes, 0, 0);

    return now > eventTime;
  }

  markAsDone(event: Event): void {
    event.stopPropagation();
    this.statusChange.emit('fait');
  }
}
