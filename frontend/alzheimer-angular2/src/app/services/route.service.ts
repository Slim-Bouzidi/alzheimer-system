import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export enum RouteStatus {
    DRAFT = 'DRAFT',
    PLANNED = 'PLANNED',
    IN_PROGRESS = 'IN_PROGRESS',
    CANCELLED = 'CANCELLED',
    DONE = 'DONE'
}

export interface RouteResponse {
    id: number;
    routeDate: string;
    mealSlotId: number;
    staffId: number;
    staffFullName?: string;
    mealSlotLabel?: string;
    status: RouteStatus;
    active: boolean;
    label?: string;
}

export interface RouteRequest {
    routeDate: string;
    mealSlotId: number;
    staffId: number;
    label?: string;
}

export interface RouteStopResponse {
    id: number;
    routeId: number;
    patientId: number;
    patientCode?: string;
    patientFullName?: string;
    stopOrder: number;
    status: string;
    deliveredAt?: string;
    notes?: string;
}

export interface RouteStopRequest {
    patientId: number;
    stopOrder: number;
    notes?: string;
}

@Injectable({ providedIn: 'root' })
export class RouteService {
    private api = 'http://localhost:8082/patient-service/api/routes';

    constructor(private http: HttpClient) { }

    getAll(): Observable<RouteResponse[]> {
        return this.http.get<RouteResponse[]>(this.api);
    }

    getById(id: number): Observable<RouteResponse> {
        return this.http.get<RouteResponse>(`${this.api}/${id}`);
    }

    getByDate(date: string): Observable<RouteResponse[]> {
        return this.http.get<RouteResponse[]>(`${this.api}/date?date=${date}`);
    }

    getByStaff(staffId: number): Observable<RouteResponse[]> {
        return this.http.get<RouteResponse[]>(`${this.api}/staff/${staffId}`);
    }

    create(data: RouteRequest): Observable<RouteResponse> {
        return this.http.post<RouteResponse>(this.api, data);
    }

    update(id: number, data: RouteRequest): Observable<RouteResponse> {
        return this.http.put<RouteResponse>(`${this.api}/${id}`, data);
    }

    changeStatus(id: number, status: RouteStatus): Observable<RouteResponse> {
        return this.http.put<RouteResponse>(`${this.api}/${id}/status?status=${status}`, {});
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/${id}`);
    }
}
