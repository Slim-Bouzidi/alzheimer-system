import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CognitiveService, ActivityRequest, ActivityResponse } from './cognitive.service';

/**
 * Karma/Jasmine unit tests for CognitiveService.
 *
 * - Jasmine  → the language: describe(), it(), expect()
 * - Karma    → the runner: opens a browser and executes the tests
 * - HttpTestingController → intercepts HTTP calls so no real server is needed
 */
describe('CognitiveService', () => {
  let service: CognitiveService;
  let httpMock: HttpTestingController;

  const API = 'http://localhost:8080/api/cognitive-activities';

  // ── sample data ──────────────────────────────────────────────
  const mockRequest: ActivityRequest = {
    patientId: 'patient-123',
    gameType: 'memory',
    score: 85,
    durationMs: 12000
  };

  const mockResponse: ActivityResponse = {
    id: 1,
    patientId: 'patient-123',
    gameType: 'memory',
    score: 85,
    durationMs: 12000,
    timestamp: '2026-04-16T10:00:00'
  };

  // ── setup / teardown ─────────────────────────────────────────
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],  // fake HttpClient — no real HTTP
      providers: [CognitiveService]
    });

    service = TestBed.inject(CognitiveService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Make sure no unexpected HTTP calls were made
    httpMock.verify();
  });

  // ── basic creation ────────────────────────────────────────────
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── saveActivity ──────────────────────────────────────────────
  describe('saveActivity', () => {

    it('should POST to the correct URL', () => {
      service.saveActivity(mockRequest).subscribe();

      const req = httpMock.expectOne(API);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should send the request body correctly', () => {
      service.saveActivity(mockRequest).subscribe();

      const req = httpMock.expectOne(API);
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should return the saved activity response', () => {
      service.saveActivity(mockRequest).subscribe(response => {
        expect(response.id).toBe(1);
        expect(response.patientId).toBe('patient-123');
        expect(response.gameType).toBe('memory');
        expect(response.score).toBe(85);
        expect(response.timestamp).toBe('2026-04-16T10:00:00');
      });

      httpMock.expectOne(API).flush(mockResponse);
    });

    it('should handle saving a reflex activity', () => {
      const reflexRequest: ActivityRequest = {
        patientId: 'patient-456',
        gameType: 'reflex',
        score: 60,
        durationMs: 5000
      };
      const reflexResponse: ActivityResponse = { ...reflexRequest, id: 2, timestamp: '2026-04-16T11:00:00' };

      service.saveActivity(reflexRequest).subscribe(response => {
        expect(response.gameType).toBe('reflex');
        expect(response.score).toBe(60);
      });

      httpMock.expectOne(API).flush(reflexResponse);
    });
  });

  // ── getPatientActivities ──────────────────────────────────────
  describe('getPatientActivities', () => {

    it('should GET from the correct URL with patient ID', () => {
      service.getPatientActivities('patient-123').subscribe();

      const req = httpMock.expectOne(`${API}/patient/patient-123`);
      expect(req.request.method).toBe('GET');
      req.flush([mockResponse]);
    });

    it('should return a list of activities for the patient', () => {
      const secondActivity: ActivityResponse = {
        id: 2, patientId: 'patient-123', gameType: 'reflex',
        score: 70, durationMs: 8000, timestamp: '2026-04-16T12:00:00'
      };

      service.getPatientActivities('patient-123').subscribe(activities => {
        expect(activities.length).toBe(2);
        expect(activities[0].gameType).toBe('memory');
        expect(activities[1].gameType).toBe('reflex');
      });

      httpMock.expectOne(`${API}/patient/patient-123`).flush([mockResponse, secondActivity]);
    });

    it('should return an empty array when patient has no activities', () => {
      service.getPatientActivities('new-patient').subscribe(activities => {
        expect(activities.length).toBe(0);
        expect(activities).toEqual([]);
      });

      httpMock.expectOne(`${API}/patient/new-patient`).flush([]);
    });

    it('should use the patientId from the URL path', () => {
      service.getPatientActivities('abc-xyz').subscribe();

      const req = httpMock.expectOne(`${API}/patient/abc-xyz`);
      expect(req.request.urlWithParams).toContain('abc-xyz');
      req.flush([]);
    });
  });

  // ── deleteActivity ────────────────────────────────────────────
  describe('deleteActivity', () => {

    it('should DELETE to the correct URL with the activity ID', () => {
      service.deleteActivity(1).subscribe();

      const req = httpMock.expectOne(`${API}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should complete without returning a body', () => {
      service.deleteActivity(5).subscribe(result => {
        expect(result).toBeNull();
      });

      httpMock.expectOne(`${API}/5`).flush(null);
    });

    it('should call the correct endpoint for different IDs', () => {
      service.deleteActivity(42).subscribe();

      const req = httpMock.expectOne(`${API}/42`);
      expect(req.request.url).toContain('/42');
      req.flush(null);
    });
  });
});
