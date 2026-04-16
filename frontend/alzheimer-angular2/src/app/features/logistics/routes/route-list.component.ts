import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouteService, RouteResponse, RouteRequest, RouteStatus, RouteStopResponse, RouteStopRequest } from '../../../services/route.service';
import { StaffService } from '../../../services/staff.service';
import { MealSlotService } from '../../../services/meal-slot.service';
import { RouteStopService } from '../../../services/route-stop.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';

@Component({
    selector: 'app-route-list',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, InputTextModule, CalendarModule, DropdownModule,
        DialogModule, ToastModule, ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './route-list.component.html',
    styleUrl: './route-list.component.scss'
})
export class RouteListComponent implements OnInit {
    private service = inject(RouteService);
    private staffService = inject(StaffService);
    private slotService = inject(MealSlotService);
    private http = inject(HttpClient);
    private stopService = inject(RouteStopService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private router = inject(Router);

    routes = signal<RouteResponse[]>([]);
    loading = signal(false);

    staffOptions: { label: string, value: string }[] = [];
    slotOptions: { label: string, value: string }[] = [];
    patientOptions: { label: string, value: number }[] = [];

    dialogVisible = signal(false);
    dialogMode = signal<'create' | 'edit'>('create');
    editingId = signal<number | null>(null);
    dateObj: Date | null = null;
    formModel: any = { routeDate: '', mealSlotId: '', staffId: '', label: '' };
    routeFieldErrors = signal<Record<string, string>>({});

    addStopVisible = signal(false);
    stopForm: RouteStopRequest = { patientId: 0, stopOrder: 1, notes: '' };
    stopFieldErrors = signal<Record<string, string>>({});

    detailsVisible = signal(false);
    selectedRoute = signal<RouteResponse | null>(null);
    stops = signal<RouteStopResponse[]>([]);

    ngOnInit() {
        this.load();
        this.loadOptions();
    }

    load() {
        this.loading.set(true);
        this.service.getAll().subscribe({
            next: (data) => { this.routes.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); this.error('Could not load routes.'); }
        });
    }

    loadOptions() {
        this.staffService.getActive().subscribe(data => {
            this.staffOptions = data.map(s => ({ label: s.fullName || s.username, value: String(s.id) }));
        });
        this.slotService.getAll().subscribe(data => {
            this.slotOptions = data.map(s => ({ label: `${s.mealType} - ${s.time}`, value: String(s.id) }));
        });
        this.http.get<any[]>('http://localhost:8082/patient-service/api/patients').subscribe((data: any) => {
            const rows: any[] = Array.isArray(data)
                ? data
                : (Array.isArray(data?.content) ? data.content : []);

            this.patientOptions = rows
                .map((p: any) => {
                    const id = Number(p?.id ?? p?.idPatient ?? p?.patientId ?? 0);
                    const code = p?.patientCode ?? p?.codePatient ?? '';
                    const firstName = p?.firstName ?? p?.prenom ?? '';
                    const lastName = p?.lastName ?? p?.nom ?? '';
                    const fullName = `${firstName} ${lastName}`.trim();
                    const label = [code, fullName].filter(Boolean).join(' - ');
                    return id > 0 ? { label, value: id } : null;
                })
                .filter((x: { label: string; value: number } | null): x is { label: string; value: number } => !!x && !!x.label);
        }, () => {
            this.patientOptions = [];
            this.error('Could not load patients for route stops.');
        });
    }

    openCreate() {
        this.dialogMode.set('create');
        this.editingId.set(null);
        this.dateObj = new Date();
        this.formModel = { routeDate: '', mealSlotId: '', staffId: '', label: '' };
        this.routeFieldErrors.set({});
        this.dialogVisible.set(true);
    }

    openEdit(r: RouteResponse) {
        this.dialogMode.set('edit');
        this.editingId.set(r.id);
        this.dateObj = new Date(r.routeDate);
        this.formModel = {
            routeDate: r.routeDate,
            mealSlotId: r.mealSlotId != null ? String(r.mealSlotId) : '',
            staffId: r.staffId != null ? String(r.staffId) : '',
            label: r.label || ''
        };
        this.routeFieldErrors.set({});
        this.dialogVisible.set(true);
    }

    clearRouteFieldError(field: 'date' | 'staffId' | 'mealSlotId') {
        const next = { ...this.routeFieldErrors() };
        delete next[field];
        this.routeFieldErrors.set(next);
    }

    save() {
        const errors: Record<string, string> = {};
        if (!this.dateObj) {
            errors['date'] = 'Route date is required.';
        }
        if (!this.formModel.staffId) {
            errors['staffId'] = 'Staff is required.';
        }
        if (!this.formModel.mealSlotId) {
            errors['mealSlotId'] = this.slotOptions.length === 0
                ? 'No meal slots available. Create one first.'
                : 'Meal slot is required.';
        }

        this.routeFieldErrors.set(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }
        const routeDateObj = this.dateObj;
        if (!routeDateObj) {
            return;
        }
        this.formModel.routeDate = routeDateObj.toISOString().substring(0, 10);
        const payload: RouteRequest = {
            routeDate: this.formModel.routeDate,
            mealSlotId: Number(this.formModel.mealSlotId),
            staffId: Number(this.formModel.staffId),
            label: this.formModel.label || undefined
        };

        const obs = this.dialogMode() === 'create'
            ? this.service.create(payload)
            : this.service.update(this.editingId()!, payload);

        obs.subscribe({
            next: () => { this.dialogVisible.set(false); this.load(); this.success('Route saved.'); },
            error: (e) => this.error(e?.error?.error || 'Operation failed.')
        });
    }

    advanceStatus(r: RouteResponse) {
        let nextStatus: RouteStatus | null = null;
        if (r.status === RouteStatus.DRAFT) nextStatus = RouteStatus.PLANNED;
        else if (r.status === RouteStatus.PLANNED) nextStatus = RouteStatus.IN_PROGRESS;
        else if (r.status === RouteStatus.IN_PROGRESS) nextStatus = RouteStatus.DONE;

        if (nextStatus) {
            // Guard: Cannot start a route without stops
            if (nextStatus === RouteStatus.IN_PROGRESS) {
                this.stopService.getStops(r.id).subscribe({
                    next: (stops) => {
                        if (!stops || stops.length === 0) {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Action blocked',
                                detail: 'Cannot start route: No stops (patients) assigned.'
                            });
                        } else {
                            this.executeStatusChange(r.id, nextStatus);
                        }
                    },
                    error: () => this.error('Could not verify stops.')
                });
            } else {
                this.executeStatusChange(r.id, nextStatus);
            }
        }
    }

    private executeStatusChange(routeId: number, status: RouteStatus) {
        this.service.changeStatus(routeId, status).subscribe({
            next: () => { this.load(); this.info(`Status changed to ${status}`); },
            error: () => this.error('Status change failed.')
        });
    }

    viewDetails(r: RouteResponse) {
        this.selectedRoute.set(r);
        this.loadStops(r.id);
        this.detailsVisible.set(true);
    }

    loadStops(routeId: number) {
        this.stopService.getStops(routeId).subscribe({
            next: (data) => this.stops.set(data),
            error: () => this.error('Could not load stops.')
        });
    }

    openAddStop() {
        const nextOrder = (this.stops().length || 0) + 1;
        this.stopForm = { patientId: 0, stopOrder: nextOrder, notes: '' };
        this.stopFieldErrors.set({});
        this.addStopVisible.set(true);
    }

    clearStopFieldError(field: 'patientId' | 'stopOrder') {
        const next = { ...this.stopFieldErrors() };
        delete next[field];
        this.stopFieldErrors.set(next);
    }

    hasSelectedPatient(): boolean {
        return Number(this.stopForm.patientId) > 0;
    }

    confirmAddStop() {
        const patientId = Number(this.stopForm.patientId);
        const stopOrder = Number(this.stopForm.stopOrder);
        const errors: Record<string, string> = {};
        if (!patientId || patientId <= 0) {
            errors['patientId'] = 'Patient is required.';
        }
        if (!stopOrder || stopOrder <= 0) {
            errors['stopOrder'] = 'Delivery order must be greater than 0.';
        }
        this.stopFieldErrors.set(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }
        const routeId = this.selectedRoute()?.id;
        if (!routeId) return;

        const payload: RouteStopRequest = {
            patientId,
            stopOrder,
            notes: this.stopForm.notes
        };

        this.stopService.addStop(routeId, payload).subscribe({
            next: () => {
                this.addStopVisible.set(false);
                this.loadStops(routeId);
                this.success('Stop added.');
            },
            error: (e) => {
                const backendMessage = e?.error?.error || e?.error?.message || '';
                if (backendMessage.toLowerCase().includes('patient')) {
                    this.stopFieldErrors.set({ ...this.stopFieldErrors(), patientId: backendMessage });
                }
                this.error(backendMessage || 'Error while adding stop.');
            }
        });
    }

    removeStop(s: RouteStopResponse) {
        this.confirmationService.confirm({
            message: `Remove this stop?`,
            accept: () => {
                this.stopService.delete(s.id).subscribe({
                    next: () => {
                        this.loadStops(this.selectedRoute()!.id);
                        this.success('Stop removed.');
                    },
                    error: () => this.error('Error while removing stop.')
                });
            }
        });
    }

    delete(r: RouteResponse) {
        this.confirmationService.confirm({
            message: `Delete this route?`,
            accept: () => this.service.delete(r.id).subscribe({
                next: () => { this.load(); this.success('Route deleted.'); },
                error: () => this.error('Delete failed.')
            })
        });
    }

    navigateToMap(r: RouteResponse) {
        if (r.status !== RouteStatus.IN_PROGRESS) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Action non autorisée',
                detail: 'Vous ne pouvez suivre que les tournées en cours (IN_PROGRESS).'
            });
            return;
        }
        this.router.navigate(['/map', r.id]);
    }

    private success(msg: string) { this.messageService.add({ severity: 'success', summary: 'Success', detail: msg }); }
    private info(msg: string) { this.messageService.add({ severity: 'info', summary: 'Info', detail: msg }); }
    private error(msg: string) { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg }); }
}
