import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ActivityRequest {
    patientId: string;
    gameType: string;
    score: number;
    durationMs: number;
}

export interface ActivityResponse extends ActivityRequest {
    id: number;
    timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class CognitiveService {
  private apiUrl = 'http://localhost:8080/api/cognitive-activities';

  constructor(private http: HttpClient) { }

  saveActivity(request: ActivityRequest): Observable<ActivityResponse> {
    return this.http.post<ActivityResponse>(this.apiUrl, request);
  }

  getPatientActivities(patientId: string): Observable<ActivityResponse[]> {
    return this.http.get<ActivityResponse[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  deleteActivity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
