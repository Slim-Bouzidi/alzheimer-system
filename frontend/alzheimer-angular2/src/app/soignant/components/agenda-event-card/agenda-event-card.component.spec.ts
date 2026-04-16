import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { AgendaEventCardComponent } from './agenda-event-card.component';
import { EvenementAgenda } from '../../../models/agenda.model';

class TranslateTestingLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

describe('AgendaEventCardComponent', () => {
  let component: AgendaEventCardComponent;
  let fixture: ComponentFixture<AgendaEventCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AgendaEventCardComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateTestingLoader },
        }),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgendaEventCardComponent);
    component = fixture.componentInstance;
    const mockEvent: EvenementAgenda = {
      id: '1',
      type: 'medicament',
      date: new Date(),
      heure: '10:00',
      titre: 'Test event',
      patientId: 'p1',
      statut: 'en_attente',
      patientNom: '',
      detail: ''
    };
    component.event = mockEvent;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
