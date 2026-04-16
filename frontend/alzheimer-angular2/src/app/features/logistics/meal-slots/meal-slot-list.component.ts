import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MealSlotService, MealSlotResponse, MealSlotRequest, MealType } from '../../../services/meal-slot.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';

@Component({
    selector: 'app-meal-slot-list',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, InputTextModule, DropdownModule,
        DialogModule, ToastModule, ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './meal-slot-list.component.html',
    styleUrl: './meal-slot-list.component.scss'
})
export class MealSlotListComponent implements OnInit {
    private service = inject(MealSlotService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    slots = signal<MealSlotResponse[]>([]);
    loading = signal(false);

    typeOptions = [
        { label: 'Breakfast', value: MealType.BREAKFAST },
        { label: 'Lunch', value: MealType.LUNCH },
        { label: 'Dinner', value: MealType.DINNER }
    ];

    dialogVisible = signal(false);
    dialogMode = signal<'create' | 'edit'>('create');
    editingId = signal<number | null>(null);
    formModel: MealSlotRequest = { time: '', mealType: MealType.BREAKFAST };
    fieldErrors = signal<Record<string, string>>({});

    ngOnInit() { this.load(); }

    load() {
        this.loading.set(true);
        this.service.getAll().subscribe({
            next: (data) => { this.slots.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); this.error('Could not load slots.'); }
        });
    }

    openCreate() {
        this.dialogMode.set('create');
        this.editingId.set(null);
        this.formModel = { time: '', mealType: MealType.BREAKFAST };
        this.fieldErrors.set({});
        this.dialogVisible.set(true);
    }

    openEdit(s: MealSlotResponse) {
        this.dialogMode.set('edit');
        this.editingId.set(s.id);
        this.formModel = { time: s.time, mealType: s.mealType };
        this.fieldErrors.set({});
        this.dialogVisible.set(true);
    }

    clearFieldError(field: 'mealType' | 'time') {
        const next = { ...this.fieldErrors() };
        delete next[field];
        this.fieldErrors.set(next);
    }

    save() {
        const time = this.formModel.time?.trim() || '';
        const errors: Record<string, string> = {};
        if (!time || !this.formModel.mealType) {
            if (!this.formModel.mealType) errors['mealType'] = 'Meal type is required.';
            if (!time) errors['time'] = 'Time is required.';
        }
        if (time && !/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(time)) {
            errors['time'] = 'Time format must be HH:mm or HH:mm:ss.';
        }

        this.fieldErrors.set(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        this.formModel.time = time;

        const obs = this.dialogMode() === 'create'
            ? this.service.create(this.formModel)
            : this.service.update(this.editingId()!, this.formModel);

        obs.subscribe({
            next: () => {
                this.dialogVisible.set(false);
                this.load();
                this.success(this.dialogMode() === 'create' ? 'Slot created.' : 'Slot updated.');
            },
            error: (e) => this.error(e?.error?.error || 'Operation failed.')
        });
    }

    delete(s: MealSlotResponse) {
        this.confirmationService.confirm({
            message: `Delete the slot ${s.mealType} at ${s.time}?`,
            header: 'Delete',
            icon: 'pi pi-trash',
            accept: () => this.service.delete(s.id).subscribe({
                next: () => { this.load(); this.success('Slot deleted.'); },
                error: () => this.error('Delete failed.')
            })
        });
    }

    private success(msg: string) { this.messageService.add({ severity: 'success', summary: 'Success', detail: msg }); }
    private error(msg: string) { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg }); }
}
