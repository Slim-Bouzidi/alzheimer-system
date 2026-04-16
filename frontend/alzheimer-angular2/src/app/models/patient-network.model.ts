/** Patient from support-network-service (PatientController) */
export interface NetworkPatient {
  id: number;
  fullName: string;
  zone?: string;
  /** WGS84 — optional, for distance ranking */
  latitude?: number;
  longitude?: number;
}

/** SupportMember ref in link response */
export interface SupportMemberRef {
  id: number;
  fullName: string;
  phone?: string;
  type?: string;
}

/** PatientSupportLink as returned by GET /api/network/patient/{patientId} */
export interface PatientSupportLink {
  id: number;
  roleInNetwork: string;
  trustLevel: string;
  priorityRank: number;
  permissions: string[];
  canAccessHome: boolean;
  patient?: NetworkPatient;
  member?: SupportMemberRef;
}

/** POST /api/network/link - must match backend LinkCreateDto */
export interface LinkCreateDto {
  patientId: number;
  memberId: number;
  roleInNetwork: string;
  trustLevel: string;
  priorityRank: number;
  permissions: string[];
  canAccessHome: boolean;
}

/** PUT /api/patients/{id} — matches backend PatientCreateDto (id comes from URL). */
export interface SupportNetworkPatientUpdateDto {
  fullName: string;
  zone?: string;
  latitude?: number;
  longitude?: number;
}

export const TRUST_LEVELS = ['TRUSTED', 'NORMAL'] as const;

/**
 * Optional permissions stored on a patient–member link (CRUD). Dispatch rules for MALAISE do not
 * require MEDICAL_NOTES — see backend `AlertDispatchPlannerService` (single source of truth).
 */
export const PERMISSION_OPTIONS = ['GPS_VIEW', 'ALERTS_ONLY', 'HOME_ACCESS', 'MEDICAL_NOTES'] as const;
