import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MembersService } from '../../services/members.service';
import { AvailabilityService } from '../../services/availability.service';
import { SupportMember } from '../../models/support-member.model';
import {
  AvailabilitySlot,
  AvailabilityCreateDto,
  DAYS_OF_WEEK,
  dayLabel,
  toTimeInputValue,
} from '../../models/availability.model';
import { RouterModule } from '@angular/router';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { trySupportNetworkDemoSafeMessage } from '../../core/support-network-demo-error';
import { getSupportNetworkHttpErrorMessage } from '../../core/support-network-http-error';
import { TablePaginationComponent } from '../../shared/components/table-pagination/table-pagination.component';

@Component({
  selector: 'app-availabilities-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule, RouterModule, ConfirmDialogComponent, TablePaginationComponent],
  templateUrl: './availabilities-page.component.html',
  styleUrls: ['../soignant-pages.css', './availabilities-page.component.scss'],
})
export class AvailabilitiesPageComponent implements OnInit {
  form: FormGroup;
  members: SupportMember[] = [];
  slots: AvailabilitySlot[] = [];
  selectedMemberId: number | null = null;
  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 20];
  editingId: number | null = null;
  loading = false;
  message: { type: 'success' | 'error'; text: string } | null = null;
  readonly daysOfWeek = DAYS_OF_WEEK;
  readonly dayLabel = dayLabel;
  readonly toTimeInputValue = toTimeInputValue;

  confirmDialogTitle = 'Confirmer';
  confirmDialogMessage = '';
  confirmDialogConfirmText = 'Supprimer';
  confirmDialogCancelText = 'Annuler';
  pendingDeleteSlot: AvailabilitySlot | null = null;

  constructor(
    private fb: FormBuilder,
    private membersService: MembersService,
    private availabilityService: AvailabilityService,
    private translate: TranslateService
  ) {
    this.form = this.fb.group({
      dayOfWeek: [1, Validators.required],
      startTime: ['08:00', Validators.required],
      endTime: ['12:00', Validators.required],
      active: [true],
    });
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    this.message = null;
    this.membersService.getAll().subscribe({
      next: (list) => {
        this.members = list;
        this.selectedMemberId = list.length > 0 ? (list[0].id ?? null) : null;
        if (this.selectedMemberId != null) this.loadSlots();
        else this.slots = [];
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.members = [];
        this.loading = false;
        this.showError(this.getErrorMessage(err, 'Erreur chargement des membres.'));
      },
    });
  }

  onMemberChange(memberId: number | null): void {
    this.selectedMemberId = memberId;
    this.currentPage = 1;
    this.cancelEdit();
    if (memberId != null) this.loadSlots();
    else this.slots = [];
  }

  loadSlots(): void {
    const mid = this.selectedMemberId;
    if (mid == null) return;
    this.loading = true;
    this.availabilityService.getByMember(mid).subscribe({
      next: (list) => {
        this.slots = list;
        this.currentPage = 1;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.slots = [];
        this.loading = false;
        this.showError(this.getErrorMessage(err, 'Erreur chargement des créneaux.'));
      },
    });
  }

  onSubmit(): void {
    this.message = null;
    const mid = this.selectedMemberId;
    if (mid == null) {
      this.showError('Veuillez choisir un membre.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showError('Veuillez remplir les champs requis.');
      return;
    }
    const v = this.form.value;
    const start = this.ensureTimeFormat(v.startTime);
    const end = this.ensureTimeFormat(v.endTime);
    if (!this.isValidTimeRange(start, end)) {
      this.showError("L'heure de fin doit être après l'heure de début.");
      return;
    }
    const dto: AvailabilityCreateDto = {
      memberId: mid,
      dayOfWeek: Number(v.dayOfWeek),
      startTime: start,
      endTime: end,
      active: !!v.active,
    };
    this.loading = true;
    if (this.editingId != null) {
      this.availabilityService.update(this.editingId, dto).subscribe({
        next: () => this.onSuccess('Créneau mis à jour.'),
        error: (err) => this.onError(err),
      });
    } else {
      this.availabilityService.create(dto).subscribe({
        next: () => this.onSuccess('Créneau ajouté.'),
        error: (err) => this.onError(err),
      });
    }
  }

  private onSuccess(msg: string): void {
    this.loading = false;
    this.showSuccess(msg);
    this.resetForm();
    this.loadSlots();
  }

  private onError(err: HttpErrorResponse): void {
    this.loading = false;
    this.showError(this.getErrorMessage(err, 'Erreur lors de l\'enregistrement.'));
  }

  private ensureTimeFormat(t: string): string {
    if (!t) return '08:00';
    return t.length === 5 ? t : t.slice(0, 5);
  }

  /** Returns true if end is strictly after start (same day, HH:mm). */
  private isValidTimeRange(start: string, end: string): boolean {
    const sm = this.parseTimeMinutes(start);
    const em = this.parseTimeMinutes(end);
    if (sm == null || em == null) return false;
    return em > sm;
  }

  private parseTimeMinutes(t: string): number | null {
    const s = this.ensureTimeFormat(t);
    const m = /^(\d{1,2}):(\d{2})$/.exec(s);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  }

  editSlot(slot: AvailabilitySlot): void {
    this.editingId = slot.id;
    this.form.patchValue({
      dayOfWeek: slot.dayOfWeek,
      startTime: toTimeInputValue(slot.startTime),
      endTime: toTimeInputValue(slot.endTime),
      active: slot.active,
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.resetForm();
  }

  deleteSlot(slot: AvailabilitySlot): void {
    this.confirmDialogTitle = 'Confirmer';
    this.confirmDialogMessage = 'Supprimer ce créneau ?';
    this.confirmDialogConfirmText = 'Supprimer';
    this.confirmDialogCancelText = 'Annuler';
    this.pendingDeleteSlot = slot;
  }

  onConfirmDialogResult(confirmed: boolean): void {
    if (confirmed && this.pendingDeleteSlot) {
      const slot = this.pendingDeleteSlot;
      this.message = null;
      this.availabilityService.delete(slot.id).subscribe({
        next: () => {
          this.showSuccess('Créneau supprimé.');
          this.loadSlots();
          if (this.editingId === slot.id) this.cancelEdit();
        },
        error: (err: HttpErrorResponse) =>
          this.showError(this.getErrorMessage(err, 'Erreur lors de la suppression.')),
      });
    }
    this.confirmDialogMessage = '';
    this.pendingDeleteSlot = null;
  }

  private resetForm(): void {
    this.editingId = null;
    this.form.reset({
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '12:00',
      active: true,
    });
    this.form.markAsUntouched();
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

  get pagedSlots(): AvailabilitySlot[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.slots.slice(start, start + this.pageSize);
  }

  onSlotsPageChange(page: number): void {
    this.currentPage = page;
  }

  onSlotsPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }
}
