import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RouteStopRequest, RouteStopResponse } from './route.service';

@Injectable({ providedIn: 'root' })
export class RouteStopService {
    private api = 'http://localhost:8082/patient-service/api/route-stops';

    constructor(private http: HttpClient) { }

    addStop(routeId: number, data: RouteStopRequest): Observable<RouteStopResponse> {
        return this.http.post<RouteStopResponse>(`${this.api}/${routeId}`, data);
    }

    getStops(routeId: number): Observable<RouteStopResponse[]> {
        return this.http.get<RouteStopResponse[]>(`${this.api}/${routeId}`);
    }

    markDelivered(id: number): Observable<RouteStopResponse> {
        return this.http.put<RouteStopResponse>(`${this.api}/${id}/delivered`, {});
    }

    markMissed(id: number): Observable<RouteStopResponse> {
        return this.http.put<RouteStopResponse>(`${this.api}/${id}/missed`, {});
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/${id}`);
    }
}
