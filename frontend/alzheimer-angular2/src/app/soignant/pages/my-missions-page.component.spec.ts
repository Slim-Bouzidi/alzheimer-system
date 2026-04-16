import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { ToastrModule } from 'ngx-toastr';
import { NEVER, of, delay } from 'rxjs';
import { MyMissionsPageComponent } from './my-missions-page.component';
import { MissionService } from '../../services/mission.service';
import { MembersService } from '../../services/members.service';
import { ReportService } from '../../services/report.service';
import { WebSocketService } from '../../services/websocket.service';
import { SupportMember } from '../../models/support-member.model';
import { Mission } from '../../models/mission.model';

describe('MyMissionsPageComponent', () => {
  let fixture: ComponentFixture<MyMissionsPageComponent>;
  let component: MyMissionsPageComponent;
  let missionSpy: jasmine.SpyObj<MissionService>;
  let membersSpy: jasmine.SpyObj<MembersService>;
  let reportSpy: jasmine.SpyObj<ReportService>;
  let wsSpy: jasmine.SpyObj<WebSocketService>;

  beforeEach(async () => {
    spyOn(window, 'confirm').and.returnValue(true);
    // GIVEN
    missionSpy = jasmine.createSpyObj('MissionService', ['getMyMissions', 'acceptMission', 'completeMission']);
    membersSpy = jasmine.createSpyObj('MembersService', ['getAll']);
    reportSpy = jasmine.createSpyObj('ReportService', ['createReport', 'getReportsByMission']);
    wsSpy = jasmine.createSpyObj('WebSocketService', [
      'watchMissions',
      'watchNotifications',
      'onMissionUpdate',
      'onNotification',
    ]);
    wsSpy.watchMissions.and.returnValue(of({}));
    wsSpy.watchNotifications.and.returnValue(of({}));
    wsSpy.onMissionUpdate.and.returnValue(NEVER);
    wsSpy.onNotification.and.returnValue(NEVER);

    membersSpy.getAll.and.returnValue(of([{ id: 1, fullName: 'Alice', type: 'FAMILY' } as SupportMember]));
    missionSpy.getMyMissions.and.returnValue(of([]));
    missionSpy.acceptMission.and.returnValue(of({ id: 1, status: 'ACCEPTED' } as Mission));
    missionSpy.completeMission.and.returnValue(of({ id: 1, status: 'COMPLETED' } as Mission));

    await TestBed.configureTestingModule({
      imports: [
        MyMissionsPageComponent,
        TranslateModule.forRoot(),
        RouterTestingModule,
        NoopAnimationsModule,
        ToastrModule.forRoot(),
      ],
      providers: [
        { provide: MissionService, useValue: missionSpy },
        { provide: MembersService, useValue: membersSpy },
        { provide: ReportService, useValue: reportSpy },
        { provide: WebSocketService, useValue: wsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyMissionsPageComponent);
    component = fixture.componentInstance;
  });

  it('should load members on init', () => {
    // WHEN
    fixture.detectChanges();
    // THEN
    expect(membersSpy.getAll).toHaveBeenCalled();
    expect(component.members.length).toBe(1);
    expect(component.selectedMemberId).toBe(1);
  });

  it('should call service when clicking Load missions', () => {
    fixture.detectChanges();
    missionSpy.getMyMissions.calls.reset();

    // WHEN
    const btn = fixture.debugElement.query(By.css('.missions-toolbar .btn-primary'));
    btn.nativeElement.click();

    // THEN
    expect(missionSpy.getMyMissions).toHaveBeenCalledWith(1);
  });

  it('should call acceptMission()', () => {
    fixture.detectChanges();
    const mission = { id: 42, status: 'PENDING', assignedMemberId: 1 } as Mission;

    // WHEN
    component.accept(mission);

    // THEN
    expect(missionSpy.acceptMission).toHaveBeenCalledWith(42);
  });

  it('should call completeMission()', () => {
    fixture.detectChanges();
    const mission = { id: 43, status: 'ACCEPTED', assignedMemberId: 1 } as Mission;

    // WHEN
    component.complete(mission);

    // THEN
    expect(missionSpy.completeMission).toHaveBeenCalledWith(43);
  });

  it('should disable load button when listLoading', fakeAsync(() => {
    // GIVEN
    missionSpy.getMyMissions.and.returnValue(of([]).pipe(delay(40)));
    fixture.detectChanges();

    // WHEN
    component.loadMissions();
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('.missions-toolbar .btn-primary')).nativeElement as HTMLButtonElement;

    // THEN
    expect(btn.disabled).toBeTrue();
    tick(40);
    fixture.detectChanges();
    expect(btn.disabled).toBeFalse();
  }));

  it('should reset pagination to page 1 when search changes', () => {
    fixture.detectChanges();
    component.missions = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      title: `Mission ${i + 1}`,
      status: 'PENDING',
      assignedMemberId: 1,
      createdAt: new Date().toISOString(),
    } as Mission));
    component.missionsLoaded = true;
    component.currentPage = 2;

    component.searchText = 'Mission';
    component.onSearchTextChange();

    expect(component.currentPage).toBe(1);
  });
});
