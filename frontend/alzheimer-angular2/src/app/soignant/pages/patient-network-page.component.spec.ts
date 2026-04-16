import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule } from 'ngx-toastr';
import { NEVER, of, throwError } from 'rxjs';
import { WebSocketService } from '../../services/websocket.service';
import { PatientNetworkPageComponent } from './patient-network-page.component';
import { MembersService } from '../../services/members.service';
import { PatientSupportLinkService } from '../../services/patient-support-link.service';
import { EngineApiService } from '../../network/services/engine-api.service';
import { DispatchPlannerApiService } from '../../network/services/dispatch-planner-api.service';
import { MissionService } from '../../services/mission.service';
import { AlertService } from '../../services/alert.service';
import { DispatchHistoryService } from '../../services/dispatch-history.service';
import { NetworkPatient } from '../../models/patient-network.model';
import { RankedIntervenant } from '../../network/models/support-network-advanced.types';

describe('PatientNetworkPageComponent', () => {
  let fixture: ComponentFixture<PatientNetworkPageComponent>;
  let component: PatientNetworkPageComponent;
  let membersSpy: jasmine.SpyObj<MembersService>;
  let linkSpy: jasmine.SpyObj<PatientSupportLinkService>;
  let engineSpy: jasmine.SpyObj<EngineApiService>;
  let dispatchSpy: jasmine.SpyObj<DispatchPlannerApiService>;
  let missionSpy: jasmine.SpyObj<MissionService>;
  let alertSpy: jasmine.SpyObj<AlertService>;
  let historySpy: jasmine.SpyObj<DispatchHistoryService>;
  let wsSpy: jasmine.SpyObj<WebSocketService>;

  beforeEach(async () => {
    membersSpy = jasmine.createSpyObj('MembersService', ['getAll']);
    linkSpy = jasmine.createSpyObj('PatientSupportLinkService', ['getPatients', 'getLinksByPatient']);
    engineSpy = jasmine.createSpyObj('EngineApiService', ['getBestIntervenants']);
    dispatchSpy = jasmine.createSpyObj('DispatchPlannerApiService', ['generatePlan']);
    missionSpy = jasmine.createSpyObj('MissionService', ['dispatchMission']);
    alertSpy = jasmine.createSpyObj('AlertService', ['triggerAlert']);
    historySpy = jasmine.createSpyObj('DispatchHistoryService', [
      'getDispatchHistoryForPatient',
      'getDispatchHistoryDetail',
    ]);
    wsSpy = jasmine.createSpyObj('WebSocketService', [
      'watchMissions',
      'watchNotifications',
      'watchDispatch',
      'onMissionUpdate',
      'onNotification',
      'onDispatchUpdate',
    ]);
    wsSpy.watchMissions.and.returnValue(of({}));
    wsSpy.watchNotifications.and.returnValue(of({}));
    wsSpy.watchDispatch.and.returnValue(of({}));
    wsSpy.onMissionUpdate.and.returnValue(NEVER);
    wsSpy.onNotification.and.returnValue(NEVER);
    wsSpy.onDispatchUpdate.and.returnValue(NEVER);

    membersSpy.getAll.and.returnValue(of([{ id: 1, fullName: 'M1', type: 'FAMILY' }]));
    linkSpy.getPatients.and.returnValue(
      of([{ id: 10, fullName: 'Patient A', zone: 'Z' } as NetworkPatient]),
    );
    linkSpy.getLinksByPatient.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        PatientNetworkPageComponent,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        RouterTestingModule,
        NoopAnimationsModule,
        ToastrModule.forRoot(),
      ],
      providers: [
        FormBuilder,
        { provide: MembersService, useValue: membersSpy },
        { provide: PatientSupportLinkService, useValue: linkSpy },
        { provide: EngineApiService, useValue: engineSpy },
        { provide: DispatchPlannerApiService, useValue: dispatchSpy },
        { provide: MissionService, useValue: missionSpy },
        { provide: AlertService, useValue: alertSpy },
        { provide: DispatchHistoryService, useValue: historySpy },
        { provide: WebSocketService, useValue: wsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientNetworkPageComponent);
    component = fixture.componentInstance;
  });

  it('should load network members on init', () => {
    // WHEN
    fixture.detectChanges();
    // THEN
    expect(membersSpy.getAll).toHaveBeenCalled();
    expect(component.members.length).toBe(1);
  });

  it('should compute best intervenants via backend service', () => {
    // GIVEN
    const ranked: RankedIntervenant[] = [
      { memberId: 1, fullName: 'M1', score: 120, reasons: [], availableNow: true } as RankedIntervenant,
    ];
    engineSpy.getBestIntervenants.and.returnValue(of(ranked));
    fixture.detectChanges();
    component.selectedPatientId = 10;
    component.links = [{ id: 1, patientId: 10, member: { id: 1 }, priorityRank: 1 } as any];

    // WHEN
    component.computeBestIntervenants();

    // THEN
    expect(engineSpy.getBestIntervenants).toHaveBeenCalled();
    expect(component.rankedIntervenants.length).toBe(1);
    expect(component.rankedIntervenants[0].memberId).toBe(1);
  });

  it('should handle empty links when computing best intervenants', () => {
    fixture.detectChanges();
    component.selectedPatientId = 10;
    component.links = [];

    // WHEN
    component.computeBestIntervenants();

    // THEN
    expect(engineSpy.getBestIntervenants).not.toHaveBeenCalled();
    expect(component.rankingError).toContain('Aucun lien');
  });

  it('should handle engine HTTP error', () => {
    engineSpy.getBestIntervenants.and.returnValue(throwError(() => ({ status: 503 })));
    fixture.detectChanges();
    component.selectedPatientId = 10;
    component.links = [{ id: 1, patientId: 10, member: { id: 1 }, priorityRank: 1 } as any];

    // WHEN
    component.computeBestIntervenants();

    // THEN
    expect(component.rankingError).toBeTruthy();
    expect(component.rankingLoading).toBeFalse();
  });

  it('should refresh dispatch history after mission dispatch when history was already queried', () => {
    fixture.detectChanges();
    component.selectedPatientId = 10;
    component.dispatchHistoryQueried = true;
    historySpy.getDispatchHistoryForPatient.and.returnValue(of([]));
    missionSpy.dispatchMission.and.returnValue(
      of({
        id: 1,
        patientId: 10,
        assignedMemberId: 1,
        alertType: 'MALAISE',
        title: 't',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      } as any),
    );

    component.dispatchMissionForMember(1);

    expect(missionSpy.dispatchMission).toHaveBeenCalled();
    expect(historySpy.getDispatchHistoryForPatient).toHaveBeenCalledWith(10);
  });

  it('should paginate ranked intervenants list', () => {
    fixture.detectChanges();
    component.rankedIntervenants = Array.from({ length: 11 }, (_, i) => ({
      memberId: i + 1,
      fullName: `Member ${i + 1}`,
      score: 100 - i,
      reasons: [],
      availableNow: true,
    } as RankedIntervenant));
    component.rankedPageSize = 5;
    component.rankedCurrentPage = 2;

    const paged = component.pagedRankedIntervenants;
    expect(paged.length).toBe(5);
    expect(paged[0].memberId).toBe(6);
  });
});
