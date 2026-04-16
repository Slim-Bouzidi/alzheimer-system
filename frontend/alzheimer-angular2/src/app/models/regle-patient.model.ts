export type TypeRegle = 'detection_chute' | 'zone_interdite' | 'comportement' | 'fugue' | 'autre';

export interface ReglePatient {
  id: string;
  patientId: string;
  patientNom: string;
  typeRegle: TypeRegle;
  libelle: string;
  seuilValeur: number;
  unite: string; // 'min', 'm', '%', etc.
  ancienSeuil?: number;
  impactDescription: string;
  actif: boolean;
  dateModif: Date;
}
