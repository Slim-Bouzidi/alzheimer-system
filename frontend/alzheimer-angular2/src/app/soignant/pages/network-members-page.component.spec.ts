import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { ToastrModule } from 'ngx-toastr';
import { NEVER, of } from 'rxjs';
import { NetworkMembersPageComponent } from './network-members-page.component';
import { MembersService } from '../../services/members.service';
import { SkillService } from '../../services/skill.service';
import { WebSocketService } from '../../services/websocket.service';

describe('NetworkMembersPageComponent (basic UI)', () => {
  let membersSpy: jasmine.SpyObj<MembersService>;
  let skillSpy: jasmine.SpyObj<SkillService>;
  let wsSpy: jasmine.SpyObj<WebSocketService>;

  beforeEach(() => {
    membersSpy = jasmine.createSpyObj('MembersService', ['getAll', 'create', 'update']);
    membersSpy.create.and.returnValue(of({ id: 99 } as any));
    membersSpy.update.and.returnValue(of({ id: 1 } as any));
    skillSpy = jasmine.createSpyObj('SkillService', ['getAllSkills']);
    skillSpy.getAllSkills.and.returnValue(of([]));
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
  });

  it('should show empty state when no members', async () => {
    membersSpy.getAll.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [
        NetworkMembersPageComponent,
        TranslateModule.forRoot(),
        RouterTestingModule,
        NoopAnimationsModule,
        ToastrModule.forRoot(),
      ],
      providers: [
        { provide: MembersService, useValue: membersSpy },
        { provide: SkillService, useValue: skillSpy },
        { provide: WebSocketService, useValue: wsSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NetworkMembersPageComponent);
    fixture.detectChanges();

    const empty = fixture.debugElement.query(By.css('.empty-state'));
    expect(empty).toBeTruthy();
  });

  it('should render list of members when data returned', async () => {
    membersSpy.getAll.and.returnValue(
      of([
        { id: 1, fullName: 'Bob', type: 'FAMILY', phone: '+21612345678', locationZone: 'Tunis' },
        { id: 2, fullName: 'Carla', type: 'VOLUNTEER', phone: '+21687654321', locationZone: 'Sfax' },
      ]),
    );
    await TestBed.configureTestingModule({
      imports: [
        NetworkMembersPageComponent,
        TranslateModule.forRoot(),
        RouterTestingModule,
        NoopAnimationsModule,
        ToastrModule.forRoot(),
      ],
      providers: [
        { provide: MembersService, useValue: membersSpy },
        { provide: SkillService, useValue: skillSpy },
        { provide: WebSocketService, useValue: wsSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NetworkMembersPageComponent);
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(2);
  });

  it('should paginate members list and switch pages', async () => {
    const members = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      fullName: `Member ${i + 1}`,
      type: 'FAMILY',
      phone: '+21612345678',
      locationZone: 'Tunis',
    }));
    membersSpy.getAll.and.returnValue(of(members as any));
    await TestBed.configureTestingModule({
      imports: [
        NetworkMembersPageComponent,
        TranslateModule.forRoot(),
        RouterTestingModule,
        NoopAnimationsModule,
        ToastrModule.forRoot(),
      ],
      providers: [
        { provide: MembersService, useValue: membersSpy },
        { provide: SkillService, useValue: skillSpy },
        { provide: WebSocketService, useValue: wsSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NetworkMembersPageComponent);
    fixture.detectChanges();

    let rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(10);

    const pageTwoButton = fixture.debugElement
      .queryAll(By.css('.table-pagination__page'))
      .find((b) => (b.nativeElement.textContent ?? '').trim() === '2');
    expect(pageTwoButton).toBeTruthy();
    pageTwoButton!.nativeElement.click();
    fixture.detectChanges();

    rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(2);
  });

  it('should parse existing international phone on edit', async () => {
    membersSpy.getAll.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [
        NetworkMembersPageComponent,
        TranslateModule.forRoot(),
        RouterTestingModule,
        NoopAnimationsModule,
        ToastrModule.forRoot(),
      ],
      providers: [
        { provide: MembersService, useValue: membersSpy },
        { provide: SkillService, useValue: skillSpy },
        { provide: WebSocketService, useValue: wsSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NetworkMembersPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.editMember({
      id: 10,
      fullName: 'Alice',
      phone: '+33123456789',
      type: 'FAMILY',
      locationZone: 'Paris',
    } as any);

    expect(component.form.get('countryIso')?.value).toBe('FR');
    expect(component.form.get('phoneLocal')?.value).toBe('123456789');
  });

  it('should normalize phone to international format before create', async () => {
    membersSpy.getAll.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [
        NetworkMembersPageComponent,
        TranslateModule.forRoot(),
        RouterTestingModule,
        NoopAnimationsModule,
        ToastrModule.forRoot(),
      ],
      providers: [
        { provide: MembersService, useValue: membersSpy },
        { provide: SkillService, useValue: skillSpy },
        { provide: WebSocketService, useValue: wsSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NetworkMembersPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({
      fullName: 'Nora',
      countryIso: 'TN',
      phoneLocal: '12345678',
      type: 'FAMILY',
      locationZone: 'Tunis',
    });

    component.onSubmit();

    expect(membersSpy.create).toHaveBeenCalled();
    const payload = membersSpy.create.calls.mostRecent().args[0];
    expect(payload.phone).toBe('+21612345678');
  });

  it('should enforce Tunisia local number to maximum 8 digits at input level', async () => {
    membersSpy.getAll.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [
        NetworkMembersPageComponent,
        TranslateModule.forRoot(),
        RouterTestingModule,
        NoopAnimationsModule,
        ToastrModule.forRoot(),
      ],
      providers: [
        { provide: MembersService, useValue: membersSpy },
        { provide: SkillService, useValue: skillSpy },
        { provide: WebSocketService, useValue: wsSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NetworkMembersPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ countryIso: 'TN', phoneLocal: '123456789999' });
    component.onPhoneLocalInput();

    expect(component.form.get('phoneLocal')?.value).toBe('12345678');
    expect(component.currentPhoneMaxLength()).toBe(8);
  });

  it('should trim local number when switching to shorter country length', async () => {
    membersSpy.getAll.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [
        NetworkMembersPageComponent,
        TranslateModule.forRoot(),
        RouterTestingModule,
        NoopAnimationsModule,
        ToastrModule.forRoot(),
      ],
      providers: [
        { provide: MembersService, useValue: membersSpy },
        { provide: SkillService, useValue: skillSpy },
        { provide: WebSocketService, useValue: wsSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NetworkMembersPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ countryIso: 'DE', phoneLocal: '12345678901' });
    component.onCountryChange('TN');

    expect(component.form.get('phoneLocal')?.value).toBe('12345678');
    expect(component.form.get('phone')?.value).toBe('+21612345678');
  });

  it('should normalize Tunisia local with leading 0 and overflow', async () => {
    membersSpy.getAll.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [
        NetworkMembersPageComponent,
        TranslateModule.forRoot(),
        RouterTestingModule,
        NoopAnimationsModule,
        ToastrModule.forRoot(),
      ],
      providers: [
        { provide: MembersService, useValue: membersSpy },
        { provide: SkillService, useValue: skillSpy },
        { provide: WebSocketService, useValue: wsSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NetworkMembersPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ countryIso: 'TN', phoneLocal: '05020735399' });
    component.onPhoneLocalInput();

    expect(component.form.get('phoneLocal')?.value).toBe('50207353');
    expect(component.form.get('phone')?.value).toBe('+21650207353');
  });
});
