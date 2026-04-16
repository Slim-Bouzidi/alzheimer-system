export type MissionStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

export interface Mission {
  id: number;
  patientId: number;
  assignedMemberId: number;
  alertType: string;
  title: string;
  description?: string | null;
  status: MissionStatus;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  /** Escalation step (1-based); optional for older API payloads. */
  stepNumber?: number;
  lastAssignedAt?: string;
}
