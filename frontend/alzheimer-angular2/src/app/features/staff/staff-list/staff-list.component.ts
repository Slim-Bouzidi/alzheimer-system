import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffService } from '../../../services/staff.service';
import { StaffProfileResponse } from '../../../core/models/staff-profile.model';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-staff-list',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, InputTextModule,
        DialogModule, ToastModule, ConfirmDialogModule, TagModule, TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './staff-list.component.html',
    styleUrl: './staff-list.component.scss'
})
export class StaffListComponent implements OnInit {
    private service = inject(StaffService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    staff = signal<StaffProfileResponse[]>([]);
    loading = signal(false);
    searchQuery = '';

    dialogVisible = signal(false);
    dialogMode = signal<'create' | 'edit'>('create');
    editingId = signal<number | null>(null);
    formModel = { username: '', fullName: '', phone: '' };
    fieldErrors = signal<Record<string, string>>({});

    ngOnInit() { this.load(); }

    load() {
        this.loading.set(true);
        this.service.getAll().subscribe({
            next: (data) => { this.staff.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load staff.' }); }
        });
    }

    get filtered(): StaffProfileResponse[] {
        if (!this.searchQuery.trim()) return this.staff();
        const q = this.searchQuery.toLowerCase();
        return this.staff().filter(s =>
            s.username?.toLowerCase().includes(q) || s.fullName?.toLowerCase().includes(q)
        );
    }

    openCreate() {
        this.dialogMode.set('create');
        this.editingId.set(null);
        this.formModel = { username: '', fullName: '', phone: '' };
        this.fieldErrors.set({});
        this.dialogVisible.set(true);
    }

    openEdit(s: StaffProfileResponse) {
        this.dialogMode.set('edit');
        this.editingId.set(s.id);
        this.formModel = { username: s.username || '', fullName: s.fullName || '', phone: s.phone || '' };
        this.fieldErrors.set({});
        this.dialogVisible.set(true);
    }

    clearFieldError(field: 'username' | 'fullName' | 'phone') {
        const next = { ...this.fieldErrors() };
        delete next[field];
        this.fieldErrors.set(next);
    }

    save() {
        const username = this.formModel.username?.trim() || '';
        const fullName = this.formModel.fullName?.trim() || '';
        const phone = this.formModel.phone?.trim() || '';

        const errors: Record<string, string> = {};
        if (!username) {
            errors['username'] = 'Username is required.';
        }
        if (!fullName) {
            errors['fullName'] = 'Full name is required.';
        }
        if (!phone) {
            errors['phone'] = 'Phone is required.';
        }

        this.fieldErrors.set(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        this.formModel.username = username;
        this.formModel.fullName = fullName;
        this.formModel.phone = phone;

        const obs = this.dialogMode() === 'create'
            ? this.service.create(this.formModel)
            : this.service.update(this.editingId()!, this.formModel);
        obs.subscribe({
            next: () => {
                this.dialogVisible.set(false);
                this.load();
                this.messageService.add({ severity: 'success', summary: 'Success', detail: this.dialogMode() === 'create' ? 'Staff created.' : 'Staff updated.' });
            },
            error: (e) => this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.error?.error || 'Operation failed.' })
        });
    }

    deactivate(s: StaffProfileResponse) {
        this.confirmationService.confirm({
            message: `Deactivate ${s.fullName}?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.service.update(s.id, { ...this.formModel, username: s.username || '', fullName: s.fullName || '', phone: s.phone || '' }).subscribe({
                    next: () => { this.load(); this.messageService.add({ severity: 'info', summary: 'Deactivated', detail: `${s.fullName} deactivated.` }); },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Deactivation failed.' })
                });
            }
        });
    }

    delete(s: StaffProfileResponse) {
        this.confirmationService.confirm({
            message: `Permanently delete ${s.fullName}?`,
            header: 'Delete',
            icon: 'pi pi-trash',
            accept: () => {
                this.service.delete(s.id).subscribe({
                    next: () => { this.load(); this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `${s.fullName} deleted.` }); },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Delete failed.' })
                });
            }
        });
    }
}
