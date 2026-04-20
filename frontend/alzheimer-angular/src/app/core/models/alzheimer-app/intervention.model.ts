export type TypeIntervention = 'visite' | 'appel' | 'surveillance' | 'soins' | 'urgence' | 'autre';

export interface Intervention {
  id: string;
  alerteId?: string;
  patientId: string;
  patientNom: string;
  type: TypeIntervention;
  dureeMinutes: number;
  description: string;
  remarques: string;
  date: Date;
  soignantId: string;
  soignantNom: string;
  peutCompleterRemarques: boolean; // true si < 24h
}
