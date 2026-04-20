export type MissionTimelineEventType =
  | 'CREATED'
  | 'EMAIL_SENT'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'ESCALATED'
  | 'COMPLETED';

export interface MissionTimelineEvent {
  type: MissionTimelineEventType | string;
  timestamp: string;
  memberName?: string | null;
  description: string;
}
