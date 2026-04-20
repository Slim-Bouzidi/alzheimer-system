import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LocationUpdateDTO {
    staffId: number;
    routeId: number;
    latitude: number;
    longitude: number;
}

export interface LocationResponseDTO {
    id: number;
    staffId: number;
    routeId: number;
    latitude: number;
    longitude: number;
    timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
    private readonly base = '/patient-service/api/locations';

    constructor(private http: HttpClient) { }

    pushLocation(dto: LocationUpdateDTO): Observable<LocationResponseDTO> {
        return this.http.post<LocationResponseDTO>(this.base, dto);
    }

    getLatest(routeId: number): Observable<LocationResponseDTO> {
        return this.http.get<LocationResponseDTO>(`${this.base}/route/${routeId}/latest`);
    }

    getTrail(routeId: number): Observable<LocationResponseDTO[]> {
        return this.http.get<LocationResponseDTO[]>(`${this.base}/route/${routeId}/trail`);
    }
}
