import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { supportNetworkHttpHeaders } from '../../core/support-network-headers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AlertType, RankedIntervenant } from '../models/support-network-advanced.types';

const BASE = (environment as { supportNetworkApiUrl?: string }).supportNetworkApiUrl ?? '/api';

/** Backend response shape for POST /api/engine/best-intervenants */
interface BestIntervenantsApiResponse {
  patientId?: number;
  generatedAt?: string;
  items?: Array<{
    memberId?: number;
    fullName?: string;
    type?: string;
    score?: number;
    reasons?: string[];
    averageRating?: number | null;
    skills?: string[];
    distanceKm?: number | null;
  }>;
}

/**
 * HTTP client for Best Intervenants only. Backend is the single source of truth for ranking rules;
 * do not add scoring or availability logic here.
 */
@Injectable({ providedIn: 'root' })
export class EngineApiService {
  private readonly baseUrl = `${BASE}/engine`;

  constructor(private http: HttpClient) {}

  /**
   * POST /api/engine/best-intervenants
   * Returns ranked list for the UI table (same shape as RankedIntervenant).
   */
  getBestIntervenants(patientId: number, nowIso: string, alertType?: AlertType): Observable<RankedIntervenant[]> {
    const body: Record<string, unknown> = { patientId, now: nowIso };
    if (alertType) {
      body['alertType'] = alertType;
    }
    return this.http
      .post<BestIntervenantsApiResponse>(`${this.baseUrl}/best-intervenants`, body, {
        headers: supportNetworkHttpHeaders(),
      })
      .pipe(
        map((res) => {
          const items = res?.items ?? [];
          return items.map(
            (item): RankedIntervenant => ({
              memberId: item.memberId ?? 0,
              fullName: item.fullName ?? '',
              type: item.type,
              score: item.score ?? 0,
              reasons: Array.isArray(item.reasons) ? item.reasons : [],
              averageRating: item.averageRating ?? null,
              skills: Array.isArray(item.skills) ? item.skills : [],
              distanceKm: item.distanceKm != null ? Number(item.distanceKm) : null,
            })
          );
        })
      );
  }
}
