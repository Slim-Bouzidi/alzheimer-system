import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ShiftResponse {
    id: number;
    staffId: number;
    staffUsername?: string;
    staffFullName?: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    active: boolean;
}

export interface ShiftRequest {
    staffId: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
}

@Injectable({ providedIn: 'root' })
export class ShiftService {
    private api = `${environment.apiUrl}/shifts`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<ShiftResponse[]> {
        return this.http.get<ShiftResponse[]>(this.api);
    }

    getByStaff(staffId: number): Observable<ShiftResponse[]> {
        return this.http.get<ShiftResponse[]>(`${this.api}/staff/${staffId}`);
    }

    getByDay(day: string): Observable<ShiftResponse[]> {
        return this.http.get<ShiftResponse[]>(`${this.api}/day?day=${day}`);
    }

    create(data: ShiftRequest): Observable<ShiftResponse> {
        return this.http.post<ShiftResponse>(this.api, data);
    }

    update(id: number, data: ShiftRequest): Observable<ShiftResponse> {
        return this.http.put<ShiftResponse>(`${this.api}/${id}`, data);
    }

    deactivate(id: number): Observable<ShiftResponse> {
        return this.http.put<ShiftResponse>(`${this.api}/${id}/deactivate`, {});
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/${id}`);
    }
}
