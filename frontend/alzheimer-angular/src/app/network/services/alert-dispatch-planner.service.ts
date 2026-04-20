/**
 * @deprecated Previously held duplicate dispatch logic (including a stricter MALAISE rule).
 * Backend defines rules: CHUTE / FUGUE / MALAISE — use `DispatchPlannerApiService` and
 * `POST /api/dispatch/plan` only. Import types from `network/models/support-network-advanced.types`.
 */
export type { AlertType, DispatchPlan, DispatchStep } from '../models/support-network-advanced.types';
export { ALERT_TYPES } from '../models/support-network-advanced.types';
