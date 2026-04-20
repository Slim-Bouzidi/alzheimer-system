export interface SupportMember {
  id?: number;
  fullName: string;
  phone?: string;
  /** Optional — mission assignment notifications */
  email?: string;
  type: string;
  locationZone?: string;
  /** WGS84 — optional, for distance ranking */
  latitude?: number;
  longitude?: number;
  notes?: string;
  /** Rolling mean from intervention reports (backend); absent until first report. */
  averageRating?: number;
  totalRatings?: number;
  /** Skill codes from backend (e.g. DOCTOR, NURSE). */
  skills?: string[];
}

/** Types align with backend SupportMember.type (String) */
export const SUPPORT_MEMBER_TYPES = [
  'DOCTOR',
  'NURSE',
  'CAREGIVER',
  'FAMILY',
  'VOLUNTEER',
  'OTHER'
] as const;
export type SupportMemberType = (typeof SUPPORT_MEMBER_TYPES)[number];
