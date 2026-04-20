export interface MissionDispatchRequest {
  patientId: number;
  assignedMemberId: number;
  alertType: string;
  title: string;
  description: string;
}
