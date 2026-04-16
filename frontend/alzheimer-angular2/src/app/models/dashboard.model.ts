export interface TopIntervenantRow {
  memberId: number;
  name: string;
  rating: number;
}

export interface NetworkDashboard {
  totalMissions: number;
  pendingMissions: number;
  completedMissions: number;
  escalatedMissions: number;
  /** Average minutes from creation to acceptance. */
  averageResponseTime: number;
  escalationCount: number;
  topIntervenants: TopIntervenantRow[];
  missionsPerZone: Record<string, number>;
}
