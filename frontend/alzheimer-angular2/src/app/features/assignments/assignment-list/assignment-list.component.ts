import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssignmentService, AssignmentResponse, AssignmentRequest } from '../../../services/assignment.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CalendarModule } from 'primeng/calendar';

@Component({
    selector: 'app-assignment-list',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, InputTextModule,
        DialogModule, ToastModule, ConfirmDialogModule, CalendarModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './assignment-list.component.html',
    styleUrl: './assignment-list.component.scss'
})
export class AssignmentListComponent implements OnInit {
    private service = inject(AssignmentService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    assignments = signal<AssignmentResponse[]>([]);
    loading = signal(false);

    dialogVisible = signal(false);
    dialogMode = signal<'create' | 'edit'>('create');
    editingId = signal<number | null>(null);
    fieldErrors = signal<Record<string, string>>({});

    formModel: AssignmentRequest & { startDateObj: Date | null; endDateObj: Date | null } = {
        username: '',
        patientCode: '',
        startDate: '',
        endDate: '',
        startDateObj: null,
        endDateObj: null
    };

    ngOnInit() { this.load(); }

    load() {
        this.loading.set(true);
        this.service.getAll().subscribe({
            next: (data) => { this.assignments.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); this.error('Could not load assignments.'); }
        });
    }

    openCreate() {
        this.dialogMode.set('create');
        this.editingId.set(null);
        this.formModel = { username: '', patientCode: '', startDate: '', endDate: '', startDateObj: null, endDateObj: null };
        this.fieldErrors.set({});
        this.dialogVisible.set(true);
    }

    openEdit(a: AssignmentResponse) {
        this.dialogMode.set('edit');
        this.editingId.set(a.id);
        this.formModel = {
            username: a.username,
            patientCode: a.patientCode || '',
            startDate: a.startDate,
            endDate: a.endDate || '',
            startDateObj: a.startDate ? new Date(a.startDate) : null,
            endDateObj: a.endDate ? new Date(a.endDate) : null
        };
        this.fieldErrors.set({});
        this.dialogVisible.set(true);
    }

    clearFieldError(field: 'username' | 'patientCode' | 'startDateObj' | 'endDateObj') {
        const next = { ...this.fieldErrors() };
        delete next[field];
        this.fieldErrors.set(next);
    }

    save() {
        const username = this.formModel.username?.trim() || '';
        const patientCode = this.formModel.patientCode?.trim() || '';
        const startDateObj = this.formModel.startDateObj;
        const endDateObj = this.formModel.endDateObj;
        const errors: Record<string, string> = {};

        if (!username || !patientCode) {
            if (!username) errors['username'] = 'Staff username is required.';
            if (!patientCode) errors['patientCode'] = 'Patient code is required.';
        }
        if (!startDateObj) {
            errors['startDateObj'] = 'Start date is required.';
        }
        if (startDateObj && endDateObj && endDateObj < startDateObj) {
            errors['endDateObj'] = 'End date must be after or equal to start date.';
        }

        this.fieldErrors.set(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        const payload: AssignmentRequest = {
            username,
            patientCode,
            startDate: startDateObj ? startDateObj.toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
            endDate: endDateObj ? endDateObj.toISOString().substring(0, 10) : undefined
        };
        const obs = this.dialogMode() === 'create'
            ? this.service.create(payload)
            : this.service.update(this.editingId()!, payload);
        obs.subscribe({
            next: () => { this.dialogVisible.set(false); this.load(); this.success(this.dialogMode() === 'create' ? 'Assignment created.' : 'Assignment updated.'); },
            error: (e) => this.error(e?.error?.error || 'Operation failed.')
        });
    }

    deactivate(a: AssignmentResponse) {
        this.confirmationService.confirm({
            message: `Deactivate assignment for ${a.staffFullName || a.username} → ${a.patientFullName || a.patientCode}?`,
            accept: () => this.service.deactivate(a.id).subscribe({ next: () => { this.load(); this.info('Assignment deactivated.'); }, error: () => this.error('Deactivation failed.') })
        });
    }

    delete(a: AssignmentResponse) {
        this.confirmationService.confirm({
            message: `Delete this assignment?`,
            header: 'Delete',
            icon: 'pi pi-trash',
            accept: () => this.service.delete(a.id).subscribe({ next: () => { this.load(); this.success('Assignment deleted.'); }, error: () => this.error('Delete failed.') })
        });
    }

    private success(msg: string) { this.messageService.add({ severity: 'success', summary: 'Success', detail: msg }); }
    private info(msg: string) { this.messageService.add({ severity: 'info', summary: 'Info', detail: msg }); }
    private error(msg: string) { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg }); }
}
