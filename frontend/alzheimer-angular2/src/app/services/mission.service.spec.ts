import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MissionService } from './mission.service';
import { MissionDispatchRequest } from '../models/mission-dispatch-request.model';

describe('MissionService', () => {
  let service: MissionService;
  let http: HttpTestingController;

  beforeEach(() => {
    // GIVEN
    TestBed.configureTestingModule({
      providers: [MissionService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MissionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should call POST /api/missions/dispatch with payload', () => {
    // GIVEN
    const payload: MissionDispatchRequest = {
      patientId: 1,
      assignedMemberId: 2,
      alertType: 'MALAISE',
      title: 'T',
      description: '',
    };

    // WHEN
    service.dispatchMission(payload).subscribe((m) => {
      // THEN
      expect(m.id).toBe(99);
    });

    const req = http.expectOne('/api/missions/dispatch');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 99, patientId: 1, assignedMemberId: 2, alertType: 'MALAISE', title: 'T', status: 'PENDING' });
  });

  it('should call PATCH /api/missions/{id}/accept', () => {
    // WHEN
    service.acceptMission(5).subscribe();

    const req = http.expectOne('/api/missions/5/accept');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 5, status: 'ACCEPTED' });
  });

  it('should call PATCH /api/missions/{id}/complete', () => {
    // WHEN
    service.completeMission(5).subscribe();

    const req = http.expectOne('/api/missions/5/complete');
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 5, status: 'COMPLETED' });
  });
});
