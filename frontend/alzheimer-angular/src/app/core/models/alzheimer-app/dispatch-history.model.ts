/** Persisted dispatch header (GET /api/dispatch/history/patient/{id}). */
export interface DispatchHistoryItem {
  id: number;
  patientId: number;
  alertType: string;
  generatedAt: string;
  status: string;
  missionId?: number | null;
}

/** One assignee row in a persisted dispatch plan. */
export interface DispatchStepExecution {
  id: number;
  stepNumber: number;
  timeoutMinutes: number;
  assigneeMemberId: number;
  assigneeName?: string | null;
  status: string;
  startedAt: string;
}

/** Dispatch + ordered steps (GET /api/dispatch/history/{dispatchId}). */
export interface DispatchHistoryDetail {
  id: number;
  patientId: number;
  alertType: string;
  generatedAt: string;
  status: string;
  missionId?: number | null;
  steps: DispatchStepExecution[];
}
