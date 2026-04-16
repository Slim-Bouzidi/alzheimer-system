export interface InterventionReport {
  id: number;
  missionId: number;
  memberId: number;
  notes: string | null;
  rating: number;
  createdAt: string;
}
