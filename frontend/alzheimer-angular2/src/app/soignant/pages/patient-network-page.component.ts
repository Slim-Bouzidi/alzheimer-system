import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MembersService } from '../../services/members.service';
import { PatientSupportLinkService } from '../../services/patient-support-link.service';
import {
  AlertType,
  ALERT_TYPES,
  DispatchPlan,
  RankedIntervenant,
} from '../../network/models/support-network-advanced.types';
import { EngineApiService } from '../../network/services/engine-api.service';
import { DispatchPlannerApiService } from '../../network/services/dispatch-planner-api.service';
import { MissionService } from '../../services/mission.service';
import { AlertService } from '../../services/alert.service';
import { DispatchHistoryService } from '../../services/dispatch-history.service';
import { DispatchHistoryDetail, DispatchHistoryItem } from '../../models/dispatch-history.model';
import { MissionDispatchRequest } from '../../models/mission-dispatch-request.model';
import { SupportMember } from '../../models/support-member.model';
import {
  NetworkPatient,
  PatientSupportLink,
  LinkCreateDto,
  TRUST_LEVELS,
  PERMISSION_OPTIONS,
} from '../../models/patient-network.model';
import { RouterModule } from '@angular/router';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { skillChipLabel } from '../../utils/skill-display';
import { trySupportNetworkDemoSafeMessage } from '../../core/support-network-demo-error';
import { getSupportNetworkHttpErrorMessage } from '../../core/support-network-http-error';
import { WebSocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TablePaginationComponent } from '../../shared/components/table-pagination/table-pagination.component';

function optionalPatientGeoLatitude(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(String(v).trim());
    if (!Number.isFinite(n)) return { geoNumber: true };
    if (n < -90 || n > 90) return { latRange: true };
    return null;
  };
}

function optionalPatientGeoLongitude(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(String(v).trim());
    if (!Number.isFinite(n)) return { geoNumber: true };
    if (n < -180 || n > 180) return { lonRange: true };
    return null;
  };
}

function normalizePatientCoordinate(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : undefined;
}

@Component({
  selector: 'app-patient-network-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule, RouterModule, ConfirmDialogComponent, TablePaginationComponent],
  templateUrl: './patient-network-page.component.html',
  styleUrls: ['../soignant-pages.css', './patient-network-page.component.scss'],
})
export class PatientNetworkPageComponent implements OnInit, OnDestroy {
  form: FormGroup;
  members: SupportMember[] = [];
  patients: NetworkPatient[] = [];
  links: PatientSupportLink[] = [];
  linksCurrentPage = 1;
  linksPageSize = 10;
  readonly linksPageSizeOptions = [5, 10, 20];
  selectedPatientId: number | null = null;
  editingLinkId: number | null = null;
  rankingLoading = false;
  rankedIntervenants: RankedIntervenant[] = [];
  rankedCurrentPage = 1;
  rankedPageSize = 5;
  readonly rankedPageSizeOptions = [5, 10, 20];
  /** Index in {@link rankedIntervenants} for optional “Top rated” chip (highest avg ≥ 4). */
  topRatedIndex: number | null = null;
  rankingError: string | null = null;
  confirmDialogTitle = 'Confirmer';
  confirmDialogMessage = '';
  confirmDialogConfirmText = 'Supprimer';
  confirmDialogCancelText = 'Annuler';
  pendingDeleteLink: PatientSupportLink | null = null;
  dispatchAlertType: AlertType = 'CHUTE';
  dispatchPlan: DispatchPlan | null = null;
  dispatchPlanError: string | null = null;
  dispatchPlanLoading = false;
  /** POST /api/alerts/trigger (full engine → plan → mission). */
  alertTriggerLoading = false;
  /** Short summary after a successful alert trigger (mission id + assignee). */
  alertTriggerLastSummary: string | null = null;

  dispatchHistoryLoading = false;
  dispatchHistoryDetailLoading = false;
  dispatchHistoryItems: DispatchHistoryItem[] = [];
  dispatchHistoryCurrentPage = 1;
  dispatchHistoryPageSize = 5;
  readonly dispatchHistoryPageSizeOptions = [5, 10, 20];
  dispatchHistoryDetail: DispatchHistoryDetail | null = null;
  dispatchHistorySelectedId: number | null = null;
  dispatchHistoryError: string | null = null;
  /** True after user clicked "Load history" (or auto-refresh after alert); avoids empty noise on first paint. */
  dispatchHistoryQueried = false;
  /** Row `memberId` while POST /api/missions/dispatch is in flight (Best intervenants table). */
  missionDispatchMemberId: number | null = null;
  readonly alertTypes = ALERT_TYPES;
  loading = false;
  message: { type: 'success' | 'error'; text: string } | null = null;
  readonly trustLevels = TRUST_LEVELS;
  readonly permissionOptions = PERMISSION_OPTIONS;
  private readonly dispatchRealtimeSubscriptions = new Map<number, Subscription>();
  private wsSubscriptions: Subscription[] = [];

  /** WGS84 for selected patient (PUT /api/patients/{id}) — used for distance ranking on the backend. */
  patientGeoForm: FormGroup;
  patientGeoSaving = false;

  constructor(
    private fb: FormBuilder,
    private membersService: MembersService,
    private linkService: PatientSupportLinkService,
    private engineApi: EngineApiService,
    private dispatchPlannerApi: DispatchPlannerApiService,
    private missionService: MissionService,
    private alertService: AlertService,
    private dispatchHistoryService: DispatchHistoryService,
    private translate: TranslateService,
    private websocketService: WebSocketService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      memberId: [null as number | null, Validators.required],
      roleInNetwork: ['', Validators.required],
      trustLevel: ['', Validators.required],
      priorityRank: [1, [Validators.required, Validators.min(1)]],
      permissions: [[] as string[]],
      canAccessHome: [false],
    });
    this.patientGeoForm = this.fb.group({
      zone: ['', [Validators.maxLength(120)]],
      latitude: [null as number | null, [optionalPatientGeoLatitude()]],
      longitude: [null as number | null, [optionalPatientGeoLongitude()]],
    });
  }

  ngOnInit(): void {
    this.loadInitial();
    this.wsSubscriptions.push(
      this.websocketService.onMissionUpdate().subscribe((event) => {
        console.log('🔄 WS Mission update:', event);
        this.toastr.success('Mission updated');
        this.loadLinks();
        if (this.dispatchHistoryQueried) {
          this.refreshDispatchHistory();
        }
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
    this.wsSubscriptions.push(
      this.websocketService.onDispatchUpdate().subscribe((event) => {
        console.log('📩 WS dispatch update:', event);
        this.toastr.success('Dispatch updated');
        if (this.dispatchHistoryQueried) {
          this.refreshDispatchHistory();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.clearDispatchRealtimeSubscriptions();
    this.wsSubscriptions.forEach((s) => s.unsubscribe());
    this.wsSubscriptions = [];
  }

  loadInitial(): void {
    this.loading = true;
    this.message = null;
    this.membersService.getAll().subscribe({
      next: (list) => {
        this.members = list;
        this.linkService.getPatients().subscribe({
          next: (patients) => {
            this.patients = patients;
            this.selectedPatientId =
              patients.length > 0 ? patients[0].id : null;
            if (this.selectedPatientId != null) this.loadLinks();
            else this.links = [];
            this.patchPatientGeoForm();
            this.loading = false;
          },
          error: (err: HttpErrorResponse) => {
            this.patients = [];
            this.selectedPatientId = null;
            this.links = [];
            this.patchPatientGeoForm();
            this.loading = false;
            this.showError(
              this.getErrorMessage(err, 'Erreur chargement patients.')
            );
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.members = [];
        this.loading = false;
        this.showError(
          this.getErrorMessage(err, 'Erreur chargement des membres.')
        );
      },
    });
  }

  onPatientChange(patientId: number | null): void {
    this.selectedPatientId = patientId;
    this.linksCurrentPage = 1;
    this.rankedCurrentPage = 1;
    this.dispatchHistoryCurrentPage = 1;
    this.cancelEdit();
    this.rankedIntervenants = [];
    this.topRatedIndex = null;
    this.dispatchPlan = null;
    this.dispatchPlanError = null;
    this.alertTriggerLastSummary = null;
    this.clearDispatchHistoryUi();
    this.rankingError = null;
    if (patientId != null) this.loadLinks();
    else this.links = [];
    this.patchPatientGeoForm();
  }

  patientLabel(p: NetworkPatient): string {
    const geo =
      p.latitude != null && p.longitude != null
        ? ` · ${Number(p.latitude).toFixed(4)}, ${Number(p.longitude).toFixed(4)}`
        : '';
    return `#${p.id} — ${p.fullName}${p.zone ? ' (' + p.zone + ')' : ''}${geo}`;
  }

  selectedPatient(): NetworkPatient | null {
    const id = this.selectedPatientId;
    if (id == null) return null;
    return this.patients.find((x) => x.id === id) ?? null;
  }

  patientGeoZoneCtrl(): AbstractControl {
    return this.patientGeoForm.get('zone')!;
  }

  patientGeoLatCtrl(): AbstractControl {
    return this.patientGeoForm.get('latitude')!;
  }

  patientGeoLonCtrl(): AbstractControl {
    return this.patientGeoForm.get('longitude')!;
  }

  savePatientGeo(): void {
    this.message = null;
    const p = this.selectedPatient();
    if (!p) {
      this.showError(this.translate.instant('PATIENT_NETWORK.GEO_NO_PATIENT'));
      return;
    }
    if (this.patientGeoForm.invalid) {
      this.patientGeoForm.markAllAsTouched();
      return;
    }
    const raw = this.patientGeoForm.value as Record<string, unknown>;
    const lat = normalizePatientCoordinate(raw['latitude']);
    const lon = normalizePatientCoordinate(raw['longitude']);
    if ((lat == null) !== (lon == null)) {
      this.showError(this.translate.instant('PATIENT_NETWORK.GEO_PAIR_REQUIRED'));
      return;
    }
    const zone = String(raw['zone'] ?? '').trim();
    this.patientGeoSaving = true;
    this.linkService
      .updatePatient(p.id, {
        fullName: p.fullName,
        zone: zone.length ? zone : undefined,
        latitude: lat,
        longitude: lon,
      })
      .subscribe({
        next: (updated) => {
          this.patientGeoSaving = false;
          const idx = this.patients.findIndex((x) => x.id === updated.id);
          if (idx >= 0) {
            this.patients[idx] = { ...this.patients[idx], ...updated };
            this.patients = [...this.patients];
          }
          this.patchPatientGeoForm();
          this.showSuccess(this.translate.instant('PATIENT_NETWORK.GEO_SAVED'));
        },
        error: (err: HttpErrorResponse) => {
          this.patientGeoSaving = false;
          this.showError(this.getErrorMessage(err, this.translate.instant('PATIENT_NETWORK.GEO_SAVE_ERROR')));
        },
      });
  }

  private patchPatientGeoForm(): void {
    const p = this.selectedPatient();
    if (!p) {
      this.patientGeoForm.reset(
        { zone: '', latitude: null, longitude: null },
        { emitEvent: false }
      );
      return;
    }
    this.patientGeoForm.patchValue(
      {
        zone: p.zone ?? '',
        latitude: p.latitude ?? null,
        longitude: p.longitude ?? null,
      },
      { emitEvent: false }
    );
    this.patientGeoForm.markAsUntouched();
  }

  /** Placeholder: open patient file/dossier (e.g. navigate to patient file or open modal). */
  openPatientFile(): void {
    const patient = this.patients.find((p) => p.id === this.selectedPatientId);
    console.log('Open patient file:', patient ?? this.selectedPatientId);
  }

  loadLinks(): void {
    const pid = this.selectedPatientId;
    if (pid == null) {
      this.links = [];
      return;
    }
    this.linkService.getLinksByPatient(pid).subscribe({
      next: (list) => {
        this.links = list;
        this.linksCurrentPage = 1;
      },
      error: (err: HttpErrorResponse) => {
        this.links = [];
        this.showError(
          this.getErrorMessage(err, 'Erreur chargement du réseau patient.')
        );
      },
    });
  }

  onSubmit(): void {
    this.message = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showError('Veuillez remplir les champs obligatoires.');
      return;
    }
    if (this.selectedPatientId == null) {
      this.showError('Veuillez sélectionner un patient.');
      return;
    }
    const patientId = this.selectedPatientId;
    const v = this.form.value;
    const memberId = Number(v.memberId);
    const dto: LinkCreateDto = {
      patientId,
      memberId,
      roleInNetwork: v.roleInNetwork,
      trustLevel: v.trustLevel,
      priorityRank: Number(v.priorityRank),
      permissions: Array.isArray(v.permissions) ? v.permissions : [],
      canAccessHome: !!v.canAccessHome,
    };

    if (this.editingLinkId == null) {
      const dup = this.links.some((l) => l.member?.id === memberId);
      if (dup) {
        this.showError('Ce membre est déjà lié à ce patient.');
        return;
      }
    } else {
      const dup = this.links.some(
        (l) => l.id !== this.editingLinkId && l.member?.id === memberId
      );
      if (dup) {
        this.showError('Ce membre est déjà lié à ce patient.');
        return;
      }
    }

    this.loading = true;
    if (this.editingLinkId != null) {
      this.linkService.updateLink(this.editingLinkId, dto).subscribe({
        next: () => {
          this.loading = false;
          this.showSuccess('Lien mis à jour.');
          this.resetFormAndReload();
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.showError(
            this.getErrorMessage(err, 'Erreur lors de la mise à jour du lien.')
          );
        },
      });
    } else {
      this.linkService.createLink(dto).subscribe({
        next: () => {
          this.loading = false;
          this.showSuccess('Lien créé.');
          this.resetFormAndReload();
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.showError(
            this.getErrorMessage(err, 'Erreur lors de la création du lien.')
          );
        },
      });
    }
  }

  editLink(link: PatientSupportLink): void {
    this.editingLinkId = link.id;
    this.form.patchValue({
      memberId: link.member?.id ?? null,
      roleInNetwork: link.roleInNetwork ?? '',
      trustLevel: link.trustLevel ?? '',
      priorityRank: link.priorityRank ?? 1,
      permissions: Array.isArray(link.permissions) ? [...link.permissions] : [],
      canAccessHome: !!link.canAccessHome,
    });
  }

  computeBestIntervenants(): void {
    this.rankingError = null;

    const patientId = this.selectedPatientId;
    if (!patientId) {
      this.rankingError = 'Veuillez sélectionner un patient.';
      return;
    }
    if (!this.links || this.links.length === 0) {
      this.rankingError = 'Aucun lien pour ce patient.';
      return;
    }

    this.rankingLoading = true;
    this.topRatedIndex = null;
    this.engineApi.getBestIntervenants(patientId, new Date().toISOString(), this.dispatchAlertType).subscribe({
      next: (ranked) => {
        this.rankedIntervenants = ranked;
        this.rankedCurrentPage = 1;
        this.topRatedIndex = this.computeTopRatedIndex(ranked);
        this.rankingLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.rankingLoading = false;
        this.topRatedIndex = null;
        this.rankingError = this.getErrorMessage(
          err,
          'Erreur lors du calcul des meilleurs intervenants.'
        );
      },
    });
  }

  formatAverageRating(r: RankedIntervenant): string {
    const a = r.averageRating;
    if (a == null) return '—';
    return `⭐ ${a.toFixed(1)} / 5`;
  }

  skillLabel(s: string): string {
    return skillChipLabel(s);
  }

  /** Skills for a linked member, merged from {@link #members} (GET /api/members includes skills). */
  skillsForLinkedMember(memberId: number | undefined | null): string[] {
    if (memberId == null) return [];
    const m = this.members.find((x) => x.id === memberId);
    return m?.skills?.length ? [...m.skills] : [];
  }

  /** Member dropdown: show catalog skills next to the name. */
  memberSelectLabel(m: SupportMember): string {
    const name = m.fullName ?? '';
    const sk = m.skills?.filter(Boolean) ?? [];
    if (!sk.length) return name;
    return `${name} (${sk.join(', ')})`;
  }

  distanceKmLabel(r: RankedIntervenant): string {
    const v = r.distanceKm;
    if (v == null) {
      return '';
    }
    return (Math.round(v * 10) / 10).toFixed(1);
  }

  private computeTopRatedIndex(items: RankedIntervenant[]): number | null {
    if (!items?.length) return null;
    let max = -1;
    for (const x of items) {
      const v = x.averageRating;
      if (v != null && v > max) max = v;
    }
    if (max < 4) return null;
    const eps = 1e-6;
    const idx = items.findIndex((x) => x.averageRating != null && Math.abs(x.averageRating - max) < eps);
    return idx >= 0 ? idx : null;
  }

  dispatchMissionForMember(memberId: number): void {
    this.message = null;
    const patientId = this.selectedPatientId;
    if (patientId == null) {
      this.showError('Veuillez sélectionner un patient.');
      return;
    }
    const alertType = this.dispatchAlertType ?? 'CHUTE';
    const payload: MissionDispatchRequest = {
      patientId,
      assignedMemberId: memberId,
      alertType,
      title: 'Intervention mission',
      description: 'Mission created from patient network dispatch',
    };
    this.missionDispatchMemberId = memberId;
    this.missionService.dispatchMission(payload).subscribe({
      next: () => {
        this.missionDispatchMemberId = null;
        this.showSuccess(this.translate.instant('PATIENT_NETWORK.MISSION_CREATED'));
        if (this.dispatchHistoryQueried) {
          this.refreshDispatchHistory();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.missionDispatchMemberId = null;
        this.showError(this.getErrorMessage(err, 'Could not create mission.'));
      },
    });
  }

  generateDispatchPlan(): void {
    this.dispatchPlanError = null;

    const patientId = this.selectedPatientId;
    if (!patientId) {
      this.dispatchPlanError = 'Veuillez sélectionner un patient.';
      return;
    }
    if (!this.links?.length) {
      this.dispatchPlanError = 'Aucun lien pour ce patient.';
      return;
    }

    this.dispatchPlanLoading = true;

    this.dispatchPlannerApi
      .generatePlan(patientId, this.dispatchAlertType, new Date().toISOString())
      .subscribe({
        next: (plan) => {
          if (!plan) {
            this.dispatchPlan = null;
            this.dispatchPlanError =
              'No available responders right now. Check member availability or permissions.';
          } else {
            this.dispatchPlan = plan;
            if (!plan.steps || plan.steps.length === 0) {
              this.dispatchPlanError =
                plan.message ?? 'No plan generated yet. Check member links and availability.';
            } else {
              // We have steps: clear any previous error
              this.dispatchPlanError = null;
            }
          }
          this.dispatchPlanLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.dispatchPlanLoading = false;
          this.dispatchPlanError = this.getErrorMessage(
            err,
            'Erreur lors de la génération du plan d\'intervention.'
          );
        },
      });
  }

  /**
   * Demo path: POST /api/alerts/trigger — engine ranking → dispatch plan → mission for step-1 assignee.
   */
  triggerAlertDemo(): void {
    this.message = null;
    this.alertTriggerLastSummary = null;
    const patientId = this.selectedPatientId;
    if (patientId == null) {
      this.showError(this.translate.instant('PATIENT_NETWORK.ALERT_TRIGGER_NO_PATIENT'));
      return;
    }
    if (!this.links?.length) {
      this.showError(this.translate.instant('PATIENT_NETWORK.ALERT_TRIGGER_NO_LINKS'));
      return;
    }
    this.alertTriggerLoading = true;
    this.alertService
      .triggerAlert({
        patientId,
        alertType: this.dispatchAlertType,
        description: this.translate.instant('PATIENT_NETWORK.ALERT_TRIGGER_DEMO_DESC'),
      })
      .subscribe({
        next: (res) => {
          this.alertTriggerLoading = false;
          const id = res.mission?.id;
          const name = res.selectedIntervenant?.fullName?.trim() || '—';
          const summary = this.translate.instant('PATIENT_NETWORK.ALERT_TRIGGER_OK', {
            id: id ?? '—',
            name,
          });
          this.alertTriggerLastSummary = summary;
          this.showSuccess(summary);
          this.loadDispatchHistory();
        },
        error: (err: HttpErrorResponse) => {
          this.alertTriggerLoading = false;
          this.showError(
            this.getErrorMessage(err, this.translate.instant('PATIENT_NETWORK.ALERT_TRIGGER_ERROR'))
          );
        },
      });
  }

  loadDispatchHistory(): void {
    const pid = this.selectedPatientId;
    if (pid == null) {
      this.dispatchHistoryError = this.translate.instant('PATIENT_NETWORK.DISPATCH_HISTORY_NO_PATIENT');
      return;
    }
    this.dispatchHistoryError = null;
    this.dispatchHistoryDetail = null;
    this.dispatchHistorySelectedId = null;
    this.dispatchHistoryLoading = true;
    this.dispatchHistoryService.getDispatchHistoryForPatient(pid).subscribe({
      next: (rows) => {
        this.dispatchHistoryItems = rows ?? [];
        this.dispatchHistoryCurrentPage = 1;
        this.dispatchHistoryLoading = false;
        this.dispatchHistoryQueried = true;
        this.ensureDispatchRealtimeSubscriptions();
      },
      error: (err: HttpErrorResponse) => {
        this.dispatchHistoryItems = [];
        this.dispatchHistoryLoading = false;
        this.dispatchHistoryQueried = true;
        this.dispatchHistoryError = this.getErrorMessage(
          err,
          this.translate.instant('PATIENT_NETWORK.DISPATCH_HISTORY_LOAD_ERR')
        );
      },
    });
  }

  /** Reload list and, if a dispatch detail was open, reload its steps (e.g. after scheduler escalation). */
  refreshDispatchHistory(): void {
    const pid = this.selectedPatientId;
    if (pid == null) {
      this.dispatchHistoryError = this.translate.instant('PATIENT_NETWORK.DISPATCH_HISTORY_NO_PATIENT');
      return;
    }
    const keepDetailId = this.dispatchHistorySelectedId;
    this.dispatchHistoryError = null;
    this.dispatchHistoryLoading = true;
    this.dispatchHistoryService.getDispatchHistoryForPatient(pid).subscribe({
      next: (rows) => {
        this.dispatchHistoryItems = rows ?? [];
        this.ensureDispatchHistoryPageInRange();
        this.dispatchHistoryLoading = false;
        this.dispatchHistoryQueried = true;
        this.ensureDispatchRealtimeSubscriptions();
        if (keepDetailId != null) {
          this.openDispatchHistoryDetail(keepDetailId);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.dispatchHistoryItems = [];
        this.dispatchHistoryLoading = false;
        this.dispatchHistoryQueried = true;
        this.dispatchHistoryError = this.getErrorMessage(
          err,
          this.translate.instant('PATIENT_NETWORK.DISPATCH_HISTORY_LOAD_ERR')
        );
      },
    });
  }

  /** CSS classes for persisted dispatch / step status (backend enums). */
  dispatchHistoryStatusClass(status: string | null | undefined): string {
    const raw = (status ?? 'unknown').toString().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return `status-badge dh-status-${raw}`;
  }

  openDispatchHistoryDetail(dispatchId: number): void {
    this.dispatchHistoryError = null;
    this.dispatchHistoryDetailLoading = true;
    this.dispatchHistorySelectedId = dispatchId;
    this.dispatchHistoryService.getDispatchHistoryDetail(dispatchId).subscribe({
      next: (detail) => {
        this.dispatchHistoryDetail = detail;
        this.dispatchHistoryDetailLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.dispatchHistoryDetail = null;
        this.dispatchHistoryDetailLoading = false;
        this.dispatchHistoryError = this.getErrorMessage(
          err,
          this.translate.instant('PATIENT_NETWORK.DISPATCH_HISTORY_DETAIL_ERR')
        );
      },
    });
  }

  closeDispatchHistoryDetail(): void {
    this.dispatchHistoryDetail = null;
    this.dispatchHistorySelectedId = null;
  }

  private clearDispatchHistoryUi(): void {
    this.dispatchHistoryItems = [];
    this.dispatchHistoryCurrentPage = 1;
    this.dispatchHistoryDetail = null;
    this.dispatchHistorySelectedId = null;
    this.dispatchHistoryError = null;
    this.dispatchHistoryLoading = false;
    this.dispatchHistoryDetailLoading = false;
    this.dispatchHistoryQueried = false;
    this.clearDispatchRealtimeSubscriptions();
  }

  private ensureDispatchRealtimeSubscriptions(): void {
    const ids = new Set(this.dispatchHistoryItems.map((x) => x.id));
    Array.from(this.dispatchRealtimeSubscriptions.entries()).forEach(([dispatchId, sub]) => {
      if (!ids.has(dispatchId)) {
        sub.unsubscribe();
        this.dispatchRealtimeSubscriptions.delete(dispatchId);
      }
    });
    this.dispatchHistoryItems.forEach((item) => {
      if (this.dispatchRealtimeSubscriptions.has(item.id)) return;
      const sub = this.websocketService.watchDispatch(item.id).subscribe(() => {
        this.showSuccess(this.translate.instant('COMMON.NEW_UPDATE_RECEIVED'));
        this.refreshDispatchHistory();
      });
      this.dispatchRealtimeSubscriptions.set(item.id, sub);
    });
  }

  private clearDispatchRealtimeSubscriptions(): void {
    this.dispatchRealtimeSubscriptions.forEach((sub) => sub.unsubscribe());
    this.dispatchRealtimeSubscriptions.clear();
  }

  cancelEdit(): void {
    this.editingLinkId = null;
    this.form.reset({
      memberId: null,
      roleInNetwork: '',
      trustLevel: '',
      priorityRank: 1,
      permissions: [],
      canAccessHome: false,
    });
    this.form.markAsUntouched();
  }

  private resetFormAndReload(): void {
    this.editingLinkId = null;
    this.form.reset({
      memberId: null,
      roleInNetwork: '',
      trustLevel: '',
      priorityRank: 1,
      permissions: [],
      canAccessHome: false,
    });
    this.form.markAsUntouched();
    this.loadLinks();
  }

  togglePermission(perm: string): void {
    const ctrl = this.form.get('permissions');
    if (!ctrl) return;
    const arr: string[] = ctrl.value ?? [];
    const idx = arr.indexOf(perm);
    if (idx === -1) arr.push(perm);
    else arr.splice(idx, 1);
    ctrl.setValue([...arr]);
    ctrl.markAsTouched();
  }

  hasPermission(perm: string): boolean {
    const arr: string[] = this.form.get('permissions')?.value ?? [];
    return arr.includes(perm);
  }

  deleteLink(link: PatientSupportLink): void {
    if (link.id == null) return;
    this.confirmDialogTitle = 'Confirmer';
    this.confirmDialogMessage = 'Supprimer ce lien du réseau patient ?';
    this.confirmDialogConfirmText = 'Supprimer';
    this.confirmDialogCancelText = 'Annuler';
    this.pendingDeleteLink = link;
  }

  onConfirmDialogResult(confirmed: boolean): void {
    if (confirmed && this.pendingDeleteLink?.id != null) {
      const link = this.pendingDeleteLink;
      this.message = null;
      this.linkService.deleteLink(link.id!).subscribe({
        next: () => {
          this.showSuccess('Lien supprimé.');
          if (this.editingLinkId === link.id) this.cancelEdit();
          this.loadLinks();
        },
        error: (err: HttpErrorResponse) =>
          this.showError(
            this.getErrorMessage(err, 'Erreur lors de la suppression.')
          ),
      });
    }
    this.confirmDialogMessage = '';
    this.pendingDeleteLink = null;
  }

  formatPermissions(link: PatientSupportLink): string {
    return (link.permissions ?? []).join(', ') || '—';
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

  get pagedLinks(): PatientSupportLink[] {
    const start = (this.linksCurrentPage - 1) * this.linksPageSize;
    return this.links.slice(start, start + this.linksPageSize);
  }

  onLinksPageChange(page: number): void {
    this.linksCurrentPage = page;
  }

  onLinksPageSizeChange(size: number): void {
    this.linksPageSize = size;
    this.linksCurrentPage = 1;
  }

  get pagedRankedIntervenants(): RankedIntervenant[] {
    const start = (this.rankedCurrentPage - 1) * this.rankedPageSize;
    return this.rankedIntervenants.slice(start, start + this.rankedPageSize);
  }

  get rankedStartIndex(): number {
    return (this.rankedCurrentPage - 1) * this.rankedPageSize;
  }

  onRankedPageChange(page: number): void {
    this.rankedCurrentPage = page;
  }

  onRankedPageSizeChange(size: number): void {
    this.rankedPageSize = size;
    this.rankedCurrentPage = 1;
  }

  isTopRatedPagedItem(localIndex: number): boolean {
    if (this.topRatedIndex == null) return false;
    return this.topRatedIndex === this.rankedStartIndex + localIndex;
  }

  get pagedDispatchHistoryItems(): DispatchHistoryItem[] {
    const start = (this.dispatchHistoryCurrentPage - 1) * this.dispatchHistoryPageSize;
    return this.dispatchHistoryItems.slice(start, start + this.dispatchHistoryPageSize);
  }

  onDispatchHistoryPageChange(page: number): void {
    this.dispatchHistoryCurrentPage = page;
  }

  onDispatchHistoryPageSizeChange(size: number): void {
    this.dispatchHistoryPageSize = size;
    this.dispatchHistoryCurrentPage = 1;
  }

  private ensureDispatchHistoryPageInRange(): void {
    const totalPages = Math.max(1, Math.ceil(this.dispatchHistoryItems.length / this.dispatchHistoryPageSize));
    if (this.dispatchHistoryCurrentPage > totalPages) {
      this.dispatchHistoryCurrentPage = totalPages;
    }
  }

  /** UI only: returns CSS class for reason chip color based on reason text. */
  getReasonChipClass(reason: string): string {
    if (!reason) return 'chip-permission';
    const r = reason.toLowerCase();
    if (r.includes('trust')) return 'chip-trust';
    if (r.includes('priority') || r.includes('rank')) return 'chip-priority';
    if (r.includes('available')) return 'chip-availability';
    if (r.includes('skill')) return 'chip-skill';
    if (r.includes('home access') || r.includes('permission')) return 'chip-permission';
    return 'chip-permission';
  }
}
