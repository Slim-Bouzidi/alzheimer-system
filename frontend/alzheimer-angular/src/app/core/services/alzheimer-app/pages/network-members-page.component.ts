import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MembersService } from '../../services/members.service';
import { SkillService } from '../../services/skill.service';
import { SupportMember, SUPPORT_MEMBER_TYPES } from '../../models/support-member.model';
import { Skill } from '../../models/skill.model';
import { skillChipLabel } from '../../utils/skill-display';
import { RouterModule } from '@angular/router';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { trySupportNetworkDemoSafeMessage } from '../../core/support-network-demo-error';
import { getSupportNetworkHttpErrorMessage } from '../../core/support-network-http-error';
import { WebSocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TablePaginationComponent } from '../../shared/components/table-pagination/table-pagination.component';

interface PhoneCountryOption {
  iso: string;
  name: string;
  flag: string;
  dialCode: string;
  localMinLength: number;
  localMaxLength: number;
}

function optionalLatitude(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(String(v).trim());
    if (!Number.isFinite(n)) return { geoNumber: true };
    if (n < -90 || n > 90) return { latRange: true };
    return null;
  };
}

function optionalLongitude(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(String(v).trim());
    if (!Number.isFinite(n)) return { geoNumber: true };
    if (n < -180 || n > 180) return { lonRange: true };
    return null;
  };
}

function normalizeCoordinate(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : undefined;
}

/** Optional email: empty is valid; non-empty must pass Angular email validator. */
function optionalEmail(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
      return null;
    }
    return Validators.email(control);
  };
}

@Component({
  selector: 'app-network-members-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule, RouterModule, ConfirmDialogComponent, TablePaginationComponent],
  templateUrl: './network-members-page.component.html',
  styleUrls: ['../soignant-pages.css', './network-members-page.component.scss'],
})
export class NetworkMembersPageComponent implements OnInit, OnDestroy {
  form: FormGroup;
  members: SupportMember[] = [];
  editingMemberId: number | null = null;
  loading = false;
  message: { type: 'success' | 'error'; text: string } | null = null;
  readonly types = SUPPORT_MEMBER_TYPES;
  readonly phoneCountries: PhoneCountryOption[] = [
    { iso: 'TN', name: 'Tunisia', flag: '🇹🇳', dialCode: '+216', localMinLength: 8, localMaxLength: 8 },
    { iso: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', localMinLength: 9, localMaxLength: 9 },
    { iso: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', localMinLength: 10, localMaxLength: 10 },
    { iso: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', localMinLength: 10, localMaxLength: 10 },
    { iso: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', localMinLength: 10, localMaxLength: 11 },
    { iso: 'MA', name: 'Morocco', flag: '🇲🇦', dialCode: '+212', localMinLength: 9, localMaxLength: 9 },
    { iso: 'DZ', name: 'Algeria', flag: '🇩🇿', dialCode: '+213', localMinLength: 8, localMaxLength: 9 },
    { iso: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20', localMinLength: 9, localMaxLength: 10 },
    { iso: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966', localMinLength: 9, localMaxLength: 9 },
  ];
  allSkills: Skill[] = [];
  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 20];
  selectedSkills: string[] = [];
  confirmDialogTitle = 'Confirmer';
  confirmDialogMessage = '';
  confirmDialogConfirmText = 'Supprimer';
  confirmDialogCancelText = 'Annuler';
  pendingDeleteMemberId: number | null = null;
  countryDropdownOpen = false;
  private wsSubscriptions: Subscription[] = [];

  get fullNameCtrl(): AbstractControl {
    return this.form.get('fullName')!;
  }
  get phoneCtrl(): AbstractControl {
    return this.form.get('phone')!;
  }
  get countryIsoCtrl(): AbstractControl {
    return this.form.get('countryIso')!;
  }
  get phoneLocalCtrl(): AbstractControl {
    return this.form.get('phoneLocal')!;
  }
  get emailCtrl(): AbstractControl {
    return this.form.get('email')!;
  }
  get typeCtrl(): AbstractControl {
    return this.form.get('type')!;
  }
  get locationZoneCtrl(): AbstractControl {
    return this.form.get('locationZone')!;
  }
  get notesCtrl(): AbstractControl {
    return this.form.get('notes')!;
  }
  get latitudeCtrl(): AbstractControl {
    return this.form.get('latitude')!;
  }
  get longitudeCtrl(): AbstractControl {
    return this.form.get('longitude')!;
  }

  constructor(
    private hostElement: ElementRef<HTMLElement>,
    private fb: FormBuilder,
    private membersService: MembersService,
    private skillService: SkillService,
    private translate: TranslateService,
    private websocketService: WebSocketService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(60),
          // Letters (including accents), spaces and hyphens only
          Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ -]+$/),
        ],
      ],
      phone: [
        '',
        [
          Validators.required,
          // Generic international format (+countrycode + local digits).
          Validators.pattern(/^\+\d{6,15}$/),
        ],
      ],
      countryIso: ['TN', Validators.required],
      phoneLocal: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      email: ['', [Validators.maxLength(320), optionalEmail()]],
      type: ['', Validators.required],
      locationZone: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(30)],
      ],
      notes: ['', [Validators.maxLength(200)]],
      latitude: [null as number | null, [optionalLatitude()]],
      longitude: [null as number | null, [optionalLongitude()]],
    });
    this.applyPhoneLocalValidators('TN');
    this.syncPhoneFromControls();
  }

  ngOnInit(): void {
    this.loadSkills();
    this.loadMembers();
    this.wsSubscriptions.push(
      this.websocketService.onMissionUpdate().subscribe((event) => {
        console.log('🔄 WS Mission update:', event);
        this.showSuccess(this.translate.instant('COMMON.NEW_UPDATE_RECEIVED'));
        this.toastr.success('Members updated');
        this.loadMembers();
      })
    );
    this.wsSubscriptions.push(
      this.websocketService.onNotification().subscribe((event) => {
        console.log('📩 WS notification:', event);
        const txt =
          event && typeof event === 'object' && 'message' in (event as Record<string, unknown>)
            ? String((event as Record<string, unknown>)['message'] ?? 'New notification')
            : 'New notification';
        this.toastr.info(txt || 'New notification');
      })
    );
  }

  ngOnDestroy(): void {
    this.wsSubscriptions.forEach((s) => s.unsubscribe());
    this.wsSubscriptions = [];
  }

  loadSkills(): void {
    this.skillService.getAllSkills().subscribe({
      next: (list) => (this.allSkills = list ?? []),
      error: () => (this.allSkills = []),
    });
  }

  skillLabel(skillName: string): string {
    return skillChipLabel(skillName);
  }

  loadMembers(): void {
    this.loading = true;
    this.message = null;
    this.membersService.getAll().subscribe({
      next: (list) => {
        this.members = list;
        this.currentPage = 1;
        this.bindRealtimeForMembers(this.members);
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.members = [];
        this.loading = false;
        this.showError(this.getErrorMessage(err, 'Erreur lors du chargement des membres.'));
      }
    });
  }

  onSubmit(): void {
    this.message = null;
    this.syncPhoneFromControls(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.value as Record<string, unknown>;
    const value: SupportMember = {
      ...(this.form.value as SupportMember),
      latitude: normalizeCoordinate(raw['latitude']),
      longitude: normalizeCoordinate(raw['longitude']),
      skills: [...this.selectedSkills],
    };
    this.loading = true;
    const id = this.editingMemberId;
    if (id == null) {
      this.membersService.create(value).subscribe({
        next: () => {
          this.loading = false;
          this.resetFormToDefaults();
          this.selectedSkills = [];
          this.showSuccess('Membre ajouté.');
          this.loadMembers();
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.showError(this.getErrorMessage(err, 'Erreur lors de l\'ajout du membre.'));
        },
      });
    } else {
      this.membersService.update(id, value).subscribe({
        next: () => {
          this.loading = false;
          this.editingMemberId = null;
          this.resetFormToDefaults();
          this.selectedSkills = [];
          this.showSuccess('Membre mis à jour.');
          this.loadMembers();
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.showError(this.getErrorMessage(err, 'Erreur lors de la mise à jour du membre.'));
        },
      });
    }
  }

  editMember(member: SupportMember): void {
    const id = member.id;
    if (id == null) return;
    this.editingMemberId = id;
    const parsedPhone = this.parsePhoneForEdition(member.phone ?? '');
    this.applyPhoneLocalValidators(parsedPhone.country.iso);
    this.form.patchValue({
      fullName: member.fullName ?? '',
      phone: parsedPhone.normalized,
      countryIso: parsedPhone.country.iso,
      phoneLocal: parsedPhone.localDigits,
      email: member.email ?? '',
      type: member.type ?? '',
      locationZone: member.locationZone ?? '',
      notes: member.notes ?? '',
      latitude: member.latitude ?? null,
      longitude: member.longitude ?? null,
    });
    this.selectedSkills = member.skills?.length ? [...member.skills] : [];
    this.form.markAsTouched();
  }

  cancelEdit(): void {
    this.editingMemberId = null;
    this.resetFormToDefaults();
    this.selectedSkills = [];
  }

  onCountryChange(iso: string): void {
    if (this.countryIsoCtrl.value !== iso) {
      this.countryIsoCtrl.setValue(iso, { emitEvent: false });
    }
    this.countryDropdownOpen = false;
    this.applyPhoneLocalValidators(iso);
    this.syncPhoneFromControls(true);
  }

  toggleCountryDropdown(): void {
    if (this.loading) return;
    this.countryDropdownOpen = !this.countryDropdownOpen;
  }

  selectPhoneCountry(iso: string): void {
    this.onCountryChange(iso);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) return;
    if (!this.hostElement.nativeElement.contains(target)) {
      this.countryDropdownOpen = false;
    }
  }

  onPhoneLocalInput(): void {
    const raw = String(this.phoneLocalCtrl.value ?? '');
    const digits = raw.replace(/\D+/g, '');
    if (raw !== digits) {
      this.phoneLocalCtrl.setValue(digits, { emitEvent: false });
    }
    this.syncPhoneFromControls(true);
  }

  deleteMember(id: number): void {
    this.confirmDialogTitle = 'Confirmer';
    this.confirmDialogMessage = 'Supprimer ce membre ?';
    this.confirmDialogConfirmText = 'Supprimer';
    this.confirmDialogCancelText = 'Annuler';
    this.pendingDeleteMemberId = id;
  }

  onConfirmDialogResult(confirmed: boolean): void {
    if (confirmed && this.pendingDeleteMemberId != null) {
      const id = this.pendingDeleteMemberId;
      this.message = null;
      if (this.editingMemberId === id) this.cancelEdit();
      this.membersService.delete(id).subscribe({
        next: () => {
          this.showSuccess('Membre supprimé.');
          this.loadMembers();
        },
        error: (err: HttpErrorResponse) =>
          this.showError(this.getErrorMessage(err, 'Erreur lors de la suppression.')),
      });
    }
    this.confirmDialogMessage = '';
    this.pendingDeleteMemberId = null;
  }

  private getErrorMessage(err: HttpErrorResponse, fallback: string): string {
    const demo = trySupportNetworkDemoSafeMessage(err, this.translate);
    if (demo !== null) return demo;
    return getSupportNetworkHttpErrorMessage(err, this.translate, fallback);
  }

  private showSuccess(text: string): void {
    this.message = { type: 'success', text };
  }

  private showError(text: string): void {
    this.message = { type: 'error', text };
  }

  private bindRealtimeForMembers(list: SupportMember[]): void {
    list.forEach((member) => {
      if (member.id != null) {
        this.websocketService.watchNotifications(member.id);
        this.websocketService.watchMissions(member.id);
      }
    });
  }

  private resetFormToDefaults(): void {
    this.applyPhoneLocalValidators('TN');
    this.form.reset({
      fullName: '',
      phone: '',
      countryIso: 'TN',
      phoneLocal: '',
      email: '',
      type: '',
      locationZone: '',
      notes: '',
      latitude: null,
      longitude: null,
    });
    this.syncPhoneFromControls();
    this.form.markAsUntouched();
  }

  private applyPhoneLocalValidators(countryIso: string): void {
    const country = this.phoneCountries.find((c) => c.iso === countryIso) ?? this.phoneCountries[0];
    this.phoneLocalCtrl.setValidators([
      Validators.required,
      Validators.pattern(/^\d+$/),
      Validators.minLength(country.localMinLength),
      Validators.maxLength(country.localMaxLength),
    ]);
    this.phoneLocalCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private syncPhoneFromControls(markTouched = false): void {
    const country = this.selectedPhoneCountry();
    let local = this.normalizeLocalDigits(country, String(this.phoneLocalCtrl.value ?? ''));
    if (String(this.phoneLocalCtrl.value ?? '') !== local) {
      this.phoneLocalCtrl.setValue(local, { emitEvent: false });
    }
    const normalized = local ? `${country.dialCode}${local}` : '';
    this.phoneCtrl.setValue(normalized, { emitEvent: false });
    if (markTouched) {
      this.phoneLocalCtrl.markAsTouched();
      this.phoneCtrl.markAsTouched();
    }
  }

  private parsePhoneForEdition(rawPhone: string): {
    country: PhoneCountryOption;
    localDigits: string;
    normalized: string;
  } {
    const normalizedInput = String(rawPhone ?? '').trim().replace(/\s+/g, '');
    const sortedCountries = [...this.phoneCountries].sort(
      (a, b) => b.dialCode.length - a.dialCode.length
    );
    const matched = sortedCountries.find((c) => normalizedInput.startsWith(c.dialCode));
    if (matched) {
      const local = this.normalizeLocalDigits(matched, normalizedInput.slice(matched.dialCode.length));
      return {
        country: matched,
        localDigits: local,
        normalized: local ? `${matched.dialCode}${local}` : '',
      };
    }
    const fallback = this.phoneCountries[0];
    const localFallback = this.normalizeLocalDigits(fallback, normalizedInput);
    return {
      country: fallback,
      localDigits: localFallback,
      normalized: localFallback ? `${fallback.dialCode}${localFallback}` : '',
    };
  }

  selectedPhoneCountry(): PhoneCountryOption {
    const iso = String(this.countryIsoCtrl.value ?? 'TN');
    return this.phoneCountries.find((c) => c.iso === iso) ?? this.phoneCountries[0];
  }

  currentPhoneMaxLength(): number {
    return this.selectedPhoneCountry().localMaxLength;
  }

  phoneLengthHint(): string {
    const c = this.selectedPhoneCountry();
    if (c.localMinLength === c.localMaxLength) {
      return `Enter exactly ${c.localMaxLength} digits for ${c.name}.`;
    }
    return `Enter ${c.localMinLength}-${c.localMaxLength} digits for ${c.name}.`;
  }

  private normalizeLocalDigits(country: PhoneCountryOption, rawValue: string): string {
    let local = String(rawValue ?? '').replace(/\D+/g, '');
    const dialDigits = country.dialCode.replace('+', '');
    if (local.startsWith(dialDigits)) {
      local = local.slice(dialDigits.length);
    }

    if (country.iso === 'TN') {
      // Tunisia local numbers are strict 8 digits; drop trunk/pasted leading zeros.
      while (local.length > country.localMaxLength && local.startsWith('0')) {
        local = local.slice(1);
      }
      if (local.length > country.localMaxLength) {
        local = local.slice(0, country.localMaxLength);
      }
      return local;
    }

    if (local.length > country.localMaxLength) {
      local = local.slice(0, country.localMaxLength);
    }
    return local;
  }

  get pagedMembers(): SupportMember[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.members.slice(start, start + this.pageSize);
  }

  onMembersPageChange(page: number): void {
    this.currentPage = page;
  }

  onMembersPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }
}
