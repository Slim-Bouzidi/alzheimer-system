/**
 * Shared UI shapes for Support Network **advanced** features (ranking + dispatch).
 *
 * **Backend is the single source of truth** for business rules:
 * - POST /api/engine/best-intervenants
 * - POST /api/dispatch/plan
 *
 * Use {@link EngineApiService} and {@link DispatchPlannerApiService} — do not re-implement scoring or filters in the UI.
 */

export interface RankedIntervenant {
  memberId: number;
  fullName: string;
  type?: string;
  score: number;
  reasons: string[];
  /** Mean report rating (1–5) when the member has at least one report; otherwise omitted. */
  averageRating?: number | null;
  /** Skill codes from backend (e.g. DOCTOR, NURSE). */
  skills?: string[];
  /** Distance to patient in km when coordinates exist on both sides. */
  distanceKm?: number | null;
}

/**
 * Values sent to POST /api/dispatch/plan. Dispatch permission gates (backend SSOT):
 * - CHUTE: HOME_ACCESS or canAccessHome on the patient–member link.
 * - FUGUE: GPS_VIEW on the link.
 * - MALAISE: no extra permission filter (backend does not require MEDICAL_NOTES or any other perm for this gate).
 */
export type AlertType = 'CHUTE' | 'FUGUE' | 'MALAISE';

export const ALERT_TYPES: AlertType[] = ['CHUTE', 'FUGUE', 'MALAISE'];

export interface DispatchStep {
  step: number;
  timeoutMinutes: number;
  timeoutLabel: string;
  assignees: RankedIntervenant[];
  note?: string;
}

export interface DispatchPlan {
  alertType: AlertType;
  steps: DispatchStep[];
  /** Optional message from backend (e.g. fallback plan). */
  message?: string;
}
