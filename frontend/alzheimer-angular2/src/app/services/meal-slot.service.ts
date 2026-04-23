import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export enum MealType {
    BREAKFAST = 'BREAKFAST',
    LUNCH = 'LUNCH',
    DINNER = 'DINNER'
}

export interface MealSlotResponse {
    id: number;
    time: string;
    mealType: MealType;
    label?: string;
    enabled: boolean;
}

export interface MealSlotRequest {
    time: string;
    mealType: MealType;
}

@Injectable({ providedIn: 'root' })
export class MealSlotService {
    private api = `${environment.apiUrl}/meal-slots`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<MealSlotResponse[]> {
        return this.http.get<MealSlotResponse[]>(this.api);
    }

    getById(id: number): Observable<MealSlotResponse> {
        return this.http.get<MealSlotResponse>(`${this.api}/${id}`);
    }

    create(data: MealSlotRequest): Observable<MealSlotResponse> {
        return this.http.post<MealSlotResponse>(this.api, data);
    }

    update(id: number, data: MealSlotRequest): Observable<MealSlotResponse> {
        return this.http.put<MealSlotResponse>(`${this.api}/${id}`, data);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/${id}`);
    }
}
