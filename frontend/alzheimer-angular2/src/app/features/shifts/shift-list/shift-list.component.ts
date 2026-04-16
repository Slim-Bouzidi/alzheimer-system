import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShiftService, ShiftResponse, ShiftRequest } from '../../../services/shift.service';
import { StaffService } from '../../../services/staff.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';

const DAYS = [
    { label: 'Monday', value: 'MONDAY' },
    { label: 'Tuesday', value: 'TUESDAY' },
    { label: 'Wednesday', value: 'WEDNESDAY' },
    { label: 'Thursday', value: 'THURSDAY' },
    { label: 'Friday', value: 'FRIDAY' },
    { label: 'Saturday', value: 'SATURDAY' },
    { label: 'Sunday', value: 'SUNDAY' },
];

const DAY_EN: Record<string, string> = {
    MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
    THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday'
};

@Component({
    selector: 'app-shift-list',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, InputTextModule, DropdownModule,
        DialogModule, ToastModule, ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './shift-list.component.html',
    styleUrl: './shift-list.component.scss'
})
export class ShiftListComponent implements OnInit {
    private service = inject(ShiftService);
    private staffService = inject(StaffService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    shifts = signal<ShiftResponse[]>([]);
    staffOptions = signal<{ label: string, value: number }[]>([]);
    staffById = signal<Record<number, { username: string; fullName: string }>>({});
    loading = signal(false);
    dayOptions = DAYS;
    dayEn = DAY_EN;

    dialogVisible = signal(false);
    dialogMode = signal<'create' | 'edit'>('create');
    editingId = signal<number | null>(null);
    formModel: ShiftRequest = { staffId: 0, dayOfWeek: '', startTime: '', endTime: '' };
    fieldErrors = signal<Record<string, string>>({});

    ngOnInit() {
        this.load();
        this.loadStaff();
    }

    load() {
        this.loading.set(true);
        this.service.getAll().subscribe({
            next: (data) => { this.shifts.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); this.error('Could not load shifts.'); }
        });
    }

    loadStaff() {
        this.staffService.getActive().subscribe({
            next: (data) => {
                const byId: Record<number, { username: string; fullName: string }> = {};
                data.forEach(s => {
                    byId[s.id] = { username: s.username || '', fullName: s.fullName || '' };
                });

                const options = data.map(s => ({
                    label: s.fullName ? `${s.fullName} (${s.username})` : s.username || 'Unknown',
                    value: s.id
                }));
                this.staffById.set(byId);
                this.staffOptions.set(options);
            }
        });
    }

    displayStaffName(s: ShiftResponse): string {
        if (s.staffFullName && s.staffFullName.trim()) {
            return s.staffFullName;
        }
        const staff = this.staffById()[s.staffId];
        if (staff?.fullName?.trim()) {
            return staff.fullName;
        }
        if (s.staffUsername && s.staffUsername.trim()) {
            return s.staffUsername;
        }
        if (staff?.username?.trim()) {
            return staff.username;
        }
        return '-';
    }

    displayStaffUsername(s: ShiftResponse): string {
        if (s.staffUsername && s.staffUsername.trim()) {
            return s.staffUsername;
        }
        const staff = this.staffById()[s.staffId];
        return staff?.username || '';
    }

    openCreate() {
        this.dialogMode.set('create');
        this.editingId.set(null);
        this.formModel = { staffId: 0, dayOfWeek: '', startTime: '', endTime: '' };
        this.fieldErrors.set({});
        this.dialogVisible.set(true);
    }

    openEdit(s: ShiftResponse) {
        this.dialogMode.set('edit');
        this.editingId.set(s.id);
        this.formModel = {
            staffId: s.staffId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime
        };
        this.fieldErrors.set({});
        this.dialogVisible.set(true);
    }

    clearFieldError(field: 'staffId' | 'dayOfWeek' | 'startTime' | 'endTime') {
        const next = { ...this.fieldErrors() };
        delete next[field];
        this.fieldErrors.set(next);
    }

    save() {
        const errors: Record<string, string> = {};
        if (!this.formModel.staffId) {
            errors['staffId'] = 'Staff is required.';
        }
        if (!this.formModel.dayOfWeek) {
            errors['dayOfWeek'] = 'Day is required.';
        }
        const start = this.formModel.startTime?.trim() || '';
        const end = this.formModel.endTime?.trim() || '';
        const hhmmOrHhmmss = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

        if (!start || !end) {
            if (!start) errors['startTime'] = 'Start time is required.';
            if (!end) errors['endTime'] = 'End time is required.';
        }
        if (start && !hhmmOrHhmmss.test(start)) {
            errors['startTime'] = 'Time format must be HH:mm or HH:mm:ss.';
        }
        if (end && !hhmmOrHhmmss.test(end)) {
            errors['endTime'] = 'Time format must be HH:mm or HH:mm:ss.';
        }

        if (start && end && hhmmOrHhmmss.test(start) && hhmmOrHhmmss.test(end) && start >= end) {
            errors['endTime'] = 'End time must be after start time.';
        }

        this.fieldErrors.set(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        this.formModel.startTime = start;
        this.formModel.endTime = end;

        const obs = this.dialogMode() === 'create'
            ? this.service.create(this.formModel)
            : this.service.update(this.editingId()!, this.formModel);
        obs.subscribe({
            next: () => { this.dialogVisible.set(false); this.load(); this.success(this.dialogMode() === 'create' ? 'Shift created.' : 'Shift updated.'); },
            error: (e) => this.error(e?.error?.error || 'Operation failed.')
        });
    }

    delete(s: ShiftResponse) {
        this.confirmationService.confirm({
            message: `Delete shift for ${this.displayStaffName(s)} (${DAY_EN[s.dayOfWeek] || s.dayOfWeek})?`,
            header: 'Delete',
            icon: 'pi pi-trash',
            accept: () => this.service.delete(s.id).subscribe({ next: () => { this.load(); this.success('Shift deleted.'); }, error: () => this.error('Delete failed.') })
        });
    }

    private success(msg: string) { this.messageService.add({ severity: 'success', summary: 'Success', detail: msg }); }
    private error(msg: string) { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg }); }
}
