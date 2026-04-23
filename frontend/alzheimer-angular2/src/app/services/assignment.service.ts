import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface AssignmentResponse {
    id: number;
    username: string;
    staffFullName?: string;
    patientId: number;
    patientCode?: string;
    patientFullName?: string;
    startDate: string;
    endDate?: string;
    active: boolean;
}

export interface AssignmentRequest {
    username: string;
    patientCode: string;
    startDate: string;
    endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class AssignmentService {
    private api = `${environment.apiUrl}/assignments`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<AssignmentResponse[]> {
        return this.http.get<AssignmentResponse[]>(this.api);
    }

    getByStaff(username: string, activeOnly = true): Observable<AssignmentResponse[]> {
        return this.http.get<AssignmentResponse[]>(`${this.api}/staff/${username}?activeOnly=${activeOnly}`);
    }

    getByPatient(patientCode: string, activeOnly = true): Observable<AssignmentResponse[]> {
        return this.http.get<AssignmentResponse[]>(`${this.api}/patient/${patientCode}?activeOnly=${activeOnly}`);
    }

    create(data: AssignmentRequest): Observable<AssignmentResponse> {
        return this.http.post<AssignmentResponse>(this.api, data);
    }

    update(id: number, data: AssignmentRequest): Observable<AssignmentResponse> {
        return this.http.put<AssignmentResponse>(`${this.api}/${id}`, data);
    }

    deactivate(id: number): Observable<AssignmentResponse> {
        return this.http.put<AssignmentResponse>(`${this.api}/${id}/deactivate`, {});
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/${id}`);
    }
}
