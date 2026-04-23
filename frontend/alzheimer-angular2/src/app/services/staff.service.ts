import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StaffProfileResponse } from '../core/models/staff-profile.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StaffService {
    private api = `${environment.apiUrl}/staff-profiles`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<StaffProfileResponse[]> {
        return this.http.get<StaffProfileResponse[]>(this.api);
    }

    getActive(): Observable<StaffProfileResponse[]> {
        return this.http.get<StaffProfileResponse[]>(`${this.api}/active`);
    }

    getById(id: number): Observable<StaffProfileResponse> {
        return this.http.get<StaffProfileResponse>(`${this.api}/${id}`);
    }

    create(data: any): Observable<StaffProfileResponse> {
        return this.http.post<StaffProfileResponse>(this.api, data);
    }

    update(id: number, data: any): Observable<StaffProfileResponse> {
        return this.http.put<StaffProfileResponse>(`${this.api}/${id}`, data);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/${id}`);
    }
}
