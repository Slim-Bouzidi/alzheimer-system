export type DeliveryStatus = 'PLANNED' | 'CONFIRMED' | 'DELIVERED';

export interface DeliveryTask {
  id: number;
  patientId?: number; // kept for legacy if needed, but not primary
  patientCode: string;
  patientFullName?: string;
  deliveryDate: string;   // ISO date string 'YYYY-MM-DD'
  plannedTime: string;    // time string 'HH:mm:ss' or 'HH:mm'
  status?: DeliveryStatus;
  assignedStaffId?: number | null;
  assignedStaffUsername?: string | null;
  assignedStaffFullName?: string | null;
  confirmedAt?: string | null;
  deliveredAt?: string | null;
  notes?: string | null;
}

export interface DeliveryTaskCreateRequest {
  patientCode: string;
  deliveryDate: string;   // 'YYYY-MM-DD'
  plannedTime: string;    // 'HH:mm:ss'
  assignedStaffUsername?: string | null;
  notes?: string | null;
}

export type DeliveryTaskUpdateRequest = DeliveryTaskCreateRequest;


