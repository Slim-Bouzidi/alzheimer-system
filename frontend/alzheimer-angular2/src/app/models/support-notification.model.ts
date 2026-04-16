export interface SupportNotification {
  id: number;
  memberId: number;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
}
