import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { supportNetworkHttpHeaders } from '../../core/support-network-headers';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AlertType,
  DispatchPlan,
  DispatchStep,
  RankedIntervenant,
} from '../models/support-network-advanced.types';

const BASE = (environment as { supportNetworkApiUrl?: string }).supportNetworkApiUrl ?? '/api';

/** Backend assignee shape */
interface AssigneeDto {
  memberId?: number;
  fullName?: string;
  type?: string;
  score?: number;
  reasons?: string[];
}

/** Backend step shape */
interface StepDto {
  stepNumber?: number;
  timeoutMinutes?: number;
  assignees?: AssigneeDto[];
  note?: string;
}

/** Backend response shape for POST /api/dispatch/plan */
interface DispatchPlanApiResponse {
  patientId?: number;
  alertType?: string;
  generatedAt?: string;
  steps?: StepDto[];
  message?: string;
}

/**
 * HTTP client for dispatch plans only. Backend is the single source of truth (including MALAISE:
 * no MEDICAL_NOTES gate). Do not add alert-type filters or step-building logic here.
 */
@Injectable({ providedIn: 'root' })
export class DispatchPlannerApiService {
  private readonly baseUrl = `${BASE}/dispatch`;

  constructor(private http: HttpClient) {}

  /**
   * POST /api/dispatch/plan
   * Returns plan in UI shape (steps with step, timeoutLabel, assignees as RankedIntervenant[]).
   */
  generatePlan(
    patientId: number,
    alertType: AlertType,
    nowIso: string
  ): Observable<DispatchPlan> {
    const body = { patientId, alertType, now: nowIso };
    return this.http
      .post<DispatchPlanApiResponse>(`${this.baseUrl}/plan`, body, {
        headers: supportNetworkHttpHeaders(),
      })
      .pipe(
        map((res) => this.mapResponseToDispatchPlan(res, alertType))
      );
  }

  private mapResponseToDispatchPlan(res: DispatchPlanApiResponse, alertType: AlertType): DispatchPlan {
    const steps: DispatchStep[] = (res?.steps ?? []).map((s) => {
      const timeoutMinutes = s.timeoutMinutes ?? 0;
      const timeoutLabel = timeoutMinutes === 0 ? '—' : `${timeoutMinutes} min`;
      const assignees: RankedIntervenant[] = (s.assignees ?? []).map((a) => ({
        memberId: a.memberId ?? 0,
        fullName: a.fullName ?? '',
        type: a.type,
        score: a.score ?? 0,
        reasons: Array.isArray(a.reasons) ? a.reasons : [],
      }));
      return {
        step: s.stepNumber ?? 0,
        timeoutMinutes,
        timeoutLabel,
        assignees,
        note: s.note,
      };
    });
    return {
      alertType,
      steps,
      message: res?.message,
    };
  }
}
