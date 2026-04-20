export type TypeRappel = 'medicament' | 'repas' | 'rendez_vous';

export type StatutRappel = 'a_faire' | 'en_attente' | 'fait' | 'en_retard' | 'reporter';

export interface RappelMedicament {
  id: string;
  type: 'medicament';
  patientId: string;
  patientNom: string;
  nom: string;
  dosage: string;
  horaires: string[]; // ex ['08:00', '20:00']
  frequence: string; // ex '2 fois par jour'
  directiveId?: string;
  actif: boolean;
  historiqueObservance: { date: string; pris: boolean }[];
}

export interface RappelRepas {
  id: string;
  type: 'repas';
  patientId: string;
  patientNom: string;
  heure: string;
  regimeAlimentaire?: string;
  directiveId?: string;
  actif: boolean;
  historiqueObservance: { date: string; consomme: boolean; quantite?: string }[];
}

export interface RappelRendezVous {
  id: string;
  type: 'rendez_vous';
  patientId: string;
  patientNom: string;
  date: string;
  heure: string;
  typeConsultation: string;
  lieu: string;
  directiveId?: string;
  actif: boolean;
}

export type Rappel = RappelMedicament | RappelRepas | RappelRendezVous;

export function isRappelMedicament(r: Rappel): r is RappelMedicament {
  return r.type === 'medicament';
}
export function isRappelRepas(r: Rappel): r is RappelRepas {
  return r.type === 'repas';
}
export function isRappelRendezVous(r: Rappel): r is RappelRendezVous {
  return r.type === 'rendez_vous';
}
