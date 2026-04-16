import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendaEventCardComponent } from './agenda-event-card.component';

describe('AgendaEventCardComponent', () => {
  let component: AgendaEventCardComponent;
  let fixture: ComponentFixture<AgendaEventCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaEventCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgendaEventCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
