import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

// ── Analysis Engine DTOs ──

export interface CognitiveScoreResponse {
    id: number;
    patientId: string;
    overallScore: number;
    category: string;
    breakdown: { [key: string]: number };
    dataPointsUsed: number;
    windowDays: number;
    computedAt: string;
}

export interface TrendAnalysisResponse {
    id: number;
    patientId: string;
    gameType: string;
    trend: string;           // IMPROVING | STABLE | DECLINING | INSUFFICIENT_DATA
    slope: number;
    rSquared: number;
    percentageChange: number;
    dataPoints: number;
    periodDays: number;
    analyzedAt: string;
}

export interface DeclineAlertResponse {
    id: number;
    patientId: string;
    severity: string;         // LOW | MEDIUM | HIGH | CRITICAL
    message: string;
    gameType: string;
    triggerSlope: number;
    confidence: number;
    acknowledged: boolean;
    createdAt: string;
    acknowledgedAt: string | null;
}

export interface PatientCognitiveReport {
    patientId: string;
    cognitiveScore: CognitiveScoreResponse;
    trends: TrendAnalysisResponse[];
    activeAlerts: DeclineAlertResponse[];
    totalGamesPlayed: number;
    recommendation: string;
}

@Injectable({
  providedIn: 'root'
})
export class CognitiveService {
  private apiUrl = `${environment.apiUrl}/cognitive-activities`;
  private analysisUrl = `${environment.apiUrl}/cognitive/analysis`;

  constructor(private http: HttpClient) { }

  // ── Existing CRUD methods ──

  saveActivity(request: ActivityRequest): Observable<ActivityResponse> {
    return this.http.post<ActivityResponse>(this.apiUrl, request);
  }

  getPatientActivities(patientId: string): Observable<ActivityResponse[]> {
    return this.http.get<ActivityResponse[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  deleteActivity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ── Analysis Engine methods (advanced, non-CRUD) ──

  /** Run full cognitive analysis pipeline */
  runAnalysis(patientId: string): Observable<PatientCognitiveReport> {
    return this.http.post<PatientCognitiveReport>(`${this.analysisUrl}/run/${patientId}`, {});
  }

  /** Get latest report without re-running */
  getReport(patientId: string): Observable<PatientCognitiveReport> {
    return this.http.get<PatientCognitiveReport>(`${this.analysisUrl}/report/${patientId}`);
  }

  /** Get latest cognitive score */
  getScore(patientId: string): Observable<CognitiveScoreResponse> {
    return this.http.get<CognitiveScoreResponse>(`${this.analysisUrl}/score/${patientId}`);
  }

  /** Get all alerts for a patient */
  getAlerts(patientId: string): Observable<DeclineAlertResponse[]> {
    return this.http.get<DeclineAlertResponse[]>(`${this.analysisUrl}/alerts/${patientId}`);
  }

  /** Acknowledge a decline alert */
  acknowledgeAlert(alertId: number): Observable<DeclineAlertResponse> {
    return this.http.patch<DeclineAlertResponse>(`${this.analysisUrl}/alerts/${alertId}/acknowledge`, {});
  }

  /** Reset/Clear all analysis data for a patient (Fresh start) */
  resetAnalysis(patientId: string): Observable<void> {
    return this.http.delete<void>(`${this.analysisUrl}/reset/${patientId}`);
  }
}

