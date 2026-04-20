import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { trySupportNetworkDemoSafeMessage } from '../../core/support-network-demo-error';
import { HttpErrorResponse } from '@angular/common/http';
import { getSupportNetworkHttpErrorMessage } from '../../core/support-network-http-error';
import { RouterModule } from '@angular/router';
import { MissionService } from '../../services/mission.service';
import { MembersService } from '../../services/members.service';
import { SupportMember } from '../../models/support-member.model';
import { Mission } from '../../models/mission.model';
import { ReportService } from '../../services/report.service';
import { InterventionReport } from '../../models/report.model';
import { WebSocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MissionTimelineEvent } from '../../models/mission-timeline-event.model';
import { TablePaginationComponent } from '../../shared/components/table-pagination/table-pagination.component';

@Component({
  selector: 'app-my-missions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule, TablePaginationComponent],
  templateUrl: './my-missions-page.component.html',
  styleUrls: ['../soignant-pages.css', './my-missions-page.component.scss'],
})
export class MyMissionsPageComponent implements OnInit, OnDestroy {
  members: SupportMember[] = [];
  selectedMemberId: number | null = null;
  missions: Mission[] = [];
  /** True after the user has clicked "Load missions" at least once (avoids empty state on first paint). */
  missionsLoaded = false;
  loading = false;
  listLoading = false;

  /** Polling interval (5s) — no WebSocket. */
  private intervalId: ReturnType<typeof setInterval> | null = null;
  /** Mission IDs seen on last successful load or poll (baseline for "new" detection). */
  private readonly previousMissionIds = new Set<number>();
  /** Rows to highlight as newly received from polling. */
  private readonly highlightedNewMissionIds = new Set<number>();
  private readonly highlightClearTimers: ReturnType<typeof setTimeout>[] = [];
  private newMissionBannerTimer: ReturnType<typeof setTimeout> | null = null;

  showNewMissionBanner = false;
  actionMissionId: number | null = null;
  message: { type: 'success' | 'error'; text: string } | null = null;
  private wsSubscriptions: Subscription[] = [];

  reportFormMission: Mission | null = null;
  reportNotes = '';
  reportRating = 5;
  readonly ratingOptions = [1, 2, 3, 4, 5] as const;
  reportSubmitting = false;

  reportsViewMissionId: number | null = null;
  reportsList: InterventionReport[] = [];
  reportsLoading = false;
  timelineMissionId: number | null = null;
  timelineEvents: MissionTimelineEvent[] = [];
  timelineLoading = false;
  selectedStatusFilter: 'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'ESCALATED' = 'ALL';
  searchText = '';
  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 20];
  private notificationAudio: HTMLAudioElement | null = null;
  private lastSoundAtMs = 0;

  constructor(
    private missionService: MissionService,
    private membersService: MembersService,
    private translate: TranslateService,
    private reportService: ReportService,
    private cdr: ChangeDetectorRef,
    private websocketService: WebSocketService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    try {
      this.notificationAudio = new Audio('assets/sounds/notification.mp3');
      this.notificationAudio.volume = 0.2;
      this.notificationAudio.preload = 'auto';
    } catch {
      this.notificationAudio = null;
    }
    this.loading = true;
    this.message = null;
    this.membersService.getAll().subscribe({
      next: (list) => {
        this.members = list;
        this.selectedMemberId = list.length > 0 ? (list[0].id ?? null) : null;
        if (this.selectedMemberId != null) {
          localStorage.setItem('supportNetwork.selectedMemberId', String(this.selectedMemberId));
        }
        this.setupRealtimeForSelectedMember();
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.members = [];
        this.selectedMemberId = null;
        this.loading = false;
        this.showError(this.getErrorMessage(err, 'Error loading members.'));
      },
    });

    this.intervalId = setInterval(() => this.pollMissions(), 5000);
  }

  ngOnDestroy(): void {
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.clearHighlightTimers();
    this.clearBannerTimer();
    this.clearWsSubscriptions();
  }

  /** Count of missions currently in PENDING status (badge). */
  get pendingMissionCount(): number {
    return this.missions.filter((m) => m.status === 'PENDING').length;
  }

  get filteredMissions(): Mission[] {
    const q = this.searchText.trim().toLowerCase();
    return this.missions.filter((m) => {
      if (this.selectedStatusFilter !== 'ALL') {
        if (this.selectedStatusFilter === 'ESCALATED') {
          if ((m.stepNumber ?? 1) <= 1) {
            return false;
          }
        } else if (m.status !== this.selectedStatusFilter) {
          return false;
        }
      }
      if (q.length > 0) {
        return (m.title ?? '').toLowerCase().includes(q);
      }
      return true;
    });
  }

  isNew(missionId: number): boolean {
    return this.highlightedNewMissionIds.has(missionId);
  }

  dismissNewMissionBanner(): void {
    this.showNewMissionBanner = false;
    this.clearBannerTimer();
    this.cdr.markForCheck();
  }

  onMemberIdChange(id: number | null): void {
    this.selectedMemberId = id;
    if (id != null) {
      localStorage.setItem('supportNetwork.selectedMemberId', String(id));
    }
    this.cancelReportForm();
    this.reportsViewMissionId = null;
    this.reportsList = [];
    this.resetMissionTrackingForMemberChange();
    this.setupRealtimeForSelectedMember();
    this.currentPage = 1;
  }

  private resetMissionTrackingForMemberChange(): void {
    this.missions = [];
    this.missionsLoaded = false;
    this.previousMissionIds.clear();
    this.highlightedNewMissionIds.clear();
    this.clearHighlightTimers();
    this.dismissNewMissionBanner();
  }

  loadMissions(): void {
    this.message = null;
    if (this.selectedMemberId == null) {
      this.showError('Select a member.');
      return;
    }
    this.listLoading = true;
    this.missionService.getMyMissions(this.selectedMemberId).subscribe({
      next: (rows) => {
        const list = rows ?? [];
        this.missions = list;
        this.missionsLoaded = true;
        this.listLoading = false;
        this.previousMissionIds.clear();
        list.forEach((m) => this.previousMissionIds.add(m.id));
        this.highlightedNewMissionIds.clear();
        this.clearHighlightTimers();
        this.dismissNewMissionBanner();
        this.currentPage = 1;
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        this.missions = [];
        this.missionsLoaded = true;
        this.listLoading = false;
        this.showError(this.getErrorMessage(err, 'Error loading missions.'));
      },
    });
  }

  /**
   * Silent refresh while the list is already shown (polling).
   * Detects new mission IDs vs. previous poll and shows a small banner + row highlight.
   */
  private pollMissions(): void {
    if (this.selectedMemberId == null || !this.missionsLoaded) {
      return;
    }
    this.missionService.getMyMissions(this.selectedMemberId).subscribe({
      next: (rows) => {
        const list = rows ?? [];
        const hadBaseline = this.previousMissionIds.size > 0;
        const newIds = list.map((m) => m.id).filter((id) => !this.previousMissionIds.has(id));
        if (hadBaseline && newIds.length > 0) {
          this.showNewMissionBanner = true;
          this.clearBannerTimer();
          this.newMissionBannerTimer = setTimeout(() => {
            this.showNewMissionBanner = false;
            this.newMissionBannerTimer = null;
            this.cdr.markForCheck();
          }, 8000);
          for (const id of newIds) {
            this.highlightedNewMissionIds.add(id);
            const t = setTimeout(() => {
              this.highlightedNewMissionIds.delete(id);
              this.cdr.markForCheck();
            }, 20000);
            this.highlightClearTimers.push(t);
          }
        }
        this.missions = list;
        this.ensurePaginationInRange(this.filteredMissions.length);
        this.previousMissionIds.clear();
        list.forEach((m) => this.previousMissionIds.add(m.id));
        this.cdr.markForCheck();
      },
      error: () => {
        /* Polling errors are ignored to avoid spamming the user. */
      },
    });
  }

  private clearHighlightTimers(): void {
    this.highlightClearTimers.forEach((t) => clearTimeout(t));
    this.highlightClearTimers.length = 0;
  }

  private clearBannerTimer(): void {
    if (this.newMissionBannerTimer != null) {
      clearTimeout(this.newMissionBannerTimer);
      this.newMissionBannerTimer = null;
    }
  }

  private clearWsSubscriptions(): void {
    this.wsSubscriptions.forEach((s) => s.unsubscribe());
    this.wsSubscriptions = [];
  }

  private setupRealtimeForSelectedMember(): void {
    this.clearWsSubscriptions();
    if (this.selectedMemberId == null) return;
    const memberId = this.selectedMemberId;
    this.websocketService.watchMissions(memberId);
    this.websocketService.watchNotifications(memberId);
    this.wsSubscriptions.push(
      this.websocketService.onMissionUpdate().subscribe((event) => {
        const eventMemberId =
          event && typeof event === 'object' && 'memberId' in (event as Record<string, unknown>)
            ? Number((event as Record<string, unknown>)['memberId'])
            : null;
        if (eventMemberId != null && this.selectedMemberId != null && eventMemberId === this.selectedMemberId) {
          console.log('🔄 WS Mission update:', event);
          this.playNotificationSound();
          this.showSuccess(this.translate.instant('COMMON.NEW_UPDATE_RECEIVED'));
          this.toastr.success('Mission updated');
          this.loadMissions();
        }
      })
    );
    this.wsSubscriptions.push(
      this.websocketService.onNotification().subscribe((event) => {
        const eventMemberId =
          event && typeof event === 'object' && 'memberId' in (event as Record<string, unknown>)
            ? Number((event as Record<string, unknown>)['memberId'])
            : null;
        if (eventMemberId != null && this.selectedMemberId != null && eventMemberId === this.selectedMemberId) {
          console.log('📩 WS notification:', event);
          this.playNotificationSound();
          const txt =
            event && typeof event === 'object' && 'message' in (event as Record<string, unknown>)
              ? String((event as Record<string, unknown>)['message'] ?? 'New notification')
              : 'New notification';
          this.toastr.info(txt || 'New notification');
        }
      })
    );
  }

  accept(m: Mission): void {
    this.message = null;
    this.actionMissionId = m.id;
    this.missionService.acceptMission(m.id).subscribe({
      next: () => {
        this.actionMissionId = null;
        this.showSuccess(this.translate.instant('MISSIONS.MSG_ACCEPTED'));
        this.loadMissions();
      },
      error: (err: HttpErrorResponse) => {
        this.actionMissionId = null;
        this.showError(this.getErrorMessage(err, 'Could not accept mission.'));
      },
    });
  }

  openReportForm(m: Mission): void {
    this.message = null;
    if (m.status !== 'COMPLETED') {
      this.showError(this.translate.instant('MISSIONS.REPORT_ERR_NOT_COMPLETED'));
      return;
    }
    if (this.selectedMemberId == null || m.assignedMemberId !== this.selectedMemberId) {
      this.showError(this.translate.instant('MISSIONS.REPORT_ERR_WRONG_MEMBER'));
      return;
    }
    this.reportFormMission = m;
    this.reportNotes = '';
    this.reportRating = 5;
    this.reportsViewMissionId = null;
    this.reportsList = [];
  }

  cancelReportForm(): void {
    this.reportFormMission = null;
    this.reportNotes = '';
    this.reportRating = 5;
  }

  submitReport(): void {
    const mission = this.reportFormMission;
    if (mission == null || this.selectedMemberId == null) {
      this.showError(this.translate.instant('MISSIONS.REPORT_ERR_CONTEXT'));
      return;
    }
    if (mission.status !== 'COMPLETED' || mission.assignedMemberId !== this.selectedMemberId) {
      this.showError(this.translate.instant('MISSIONS.REPORT_ERR_CONTEXT'));
      return;
    }
    const rating = Number(this.reportRating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      this.showError(this.translate.instant('MISSIONS.REPORT_ERR_RATING'));
      return;
    }
    this.message = null;
    this.reportSubmitting = true;
    this.reportService
      .createReport({
        missionId: mission.id,
        memberId: mission.assignedMemberId,
        notes: this.reportNotes?.trim() ?? '',
        rating,
      })
      .subscribe({
        next: () => {
          this.reportSubmitting = false;
          const mid = mission.id;
          this.cancelReportForm();
          this.showSuccess(this.translate.instant('MISSIONS.REPORT_MSG_CREATED'));
          this.loadMissions();
          if (this.reportsViewMissionId === mid) {
            this.loadReportsForMission(mid);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.reportSubmitting = false;
          this.showError(this.getErrorMessage(err, this.translate.instant('MISSIONS.REPORT_ERR_CREATE')));
        },
      });
  }

  toggleReports(m: Mission): void {
    this.message = null;
    if (this.reportsViewMissionId === m.id) {
      this.reportsViewMissionId = null;
      this.reportsList = [];
      return;
    }
    this.reportsViewMissionId = m.id;
    this.loadReportsForMission(m.id);
  }

  viewTimeline(m: Mission): void {
    this.timelineMissionId = m.id;
    this.timelineLoading = true;
    this.timelineEvents = [];
    this.missionService.getTimeline(m.id).subscribe({
      next: (rows) => {
        this.timelineEvents = (rows ?? []).slice().sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        this.timelineLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.timelineEvents = [];
        this.timelineLoading = false;
        this.showError(this.getErrorMessage(err, 'Could not load timeline.'));
      },
    });
  }

  closeTimeline(): void {
    this.timelineMissionId = null;
    this.timelineEvents = [];
    this.timelineLoading = false;
  }

  timelineIcon(type: string): string {
    switch (type) {
      case 'CREATED':
        return '🟢';
      case 'EMAIL_SENT':
        return '📧';
      case 'DECLINED':
        return '🟠';
      case 'ESCALATED':
        return '🔺';
      case 'ACCEPTED':
        return '✅';
      case 'COMPLETED':
        return '🏁';
      default:
        return '•';
    }
  }

  private loadReportsForMission(missionId: number): void {
    this.reportsLoading = true;
    this.reportService.getReportsByMission(missionId).subscribe({
      next: (rows) => {
        this.reportsList = rows ?? [];
        this.reportsLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.reportsList = [];
        this.reportsLoading = false;
        this.showError(this.getErrorMessage(err, this.translate.instant('MISSIONS.REPORT_ERR_LOAD')));
      },
    });
  }

  complete(m: Mission): void {
    this.message = null;
    const confirmMsg = this.translate.instant('MISSIONS.CONFIRM_COMPLETE');
    if (!window.confirm(confirmMsg)) {
      return;
    }
    this.actionMissionId = m.id;
    this.missionService.completeMission(m.id).subscribe({
      next: () => {
        this.actionMissionId = null;
        this.showSuccess(this.translate.instant('MISSIONS.MSG_COMPLETED'));
        this.loadMissions();
      },
      error: (err: HttpErrorResponse) => {
        this.actionMissionId = null;
        this.showError(this.getErrorMessage(err, 'Could not complete mission.'));
      },
    });
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

  exportCsv(): void {
    const header = ['id', 'title', 'status', 'assignedMemberId', 'createdAt'];
    const rows = this.filteredMissions.map((m) => [
      String(m.id ?? ''),
      this.csvEscape(m.title ?? ''),
      this.csvEscape(this.getMissionStatusLabel(m)),
      String(m.assignedMemberId ?? ''),
      String(m.createdAt ?? ''),
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'missions-export.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
  }

  onSearchTextChange(): void {
    this.currentPage = 1;
  }

  get pagedFilteredMissions(): Mission[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredMissions.slice(start, start + this.pageSize);
  }

  onMissionsPageChange(page: number): void {
    this.currentPage = page;
  }

  onMissionsPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  private ensurePaginationInRange(totalItems: number): void {
    const totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
  }

  private getMissionStatusLabel(m: Mission): string {
    if ((m.stepNumber ?? 1) > 1) {
      return 'ESCALATED';
    }
    return m.status ?? '';
  }

  private csvEscape(raw: string): string {
    const value = String(raw ?? '');
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  private playNotificationSound(): void {
    const now = Date.now();
    if (now - this.lastSoundAtMs < 1200) {
      return;
    }
    this.lastSoundAtMs = now;
    if (!this.notificationAudio) {
      this.playFallbackBeep();
      return;
    }
    this.notificationAudio.currentTime = 0;
    this.notificationAudio.play().catch(() => this.playFallbackBeep());
  }

  private playFallbackBeep(): void {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.03;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1);
    } catch {
      // Ignore if browser blocks programmatic audio.
    }
  }
}
