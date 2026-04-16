import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MembersService } from './members.service';
import { HttpErrorResponse } from '@angular/common/http';

describe('MembersService', () => {
  let service: MembersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MembersService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MembersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should call GET /api/members and return list', (done) => {
    // WHEN
    service.getAll().subscribe((list) => {
      // THEN
      expect(list.length).toBe(1);
      expect(list[0].fullName).toBe('Alice');
      done();
    });

    const req = http.expectOne('/api/members');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, fullName: 'Alice', type: 'FAMILY' }]);
  });

  it('should propagate HTTP error', (done) => {
    // WHEN
    service.getAll().subscribe({
      next: () => fail('expected error'),
      error: (err: HttpErrorResponse) => {
        // THEN
        expect(err.status).toBe(500);
        done();
      },
    });

    const req = http.expectOne('/api/members');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });
});
