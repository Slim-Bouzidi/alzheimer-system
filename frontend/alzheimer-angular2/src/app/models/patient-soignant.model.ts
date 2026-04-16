export type NiveauRisque = 'faible' | 'moyen' | 'eleve';

export interface PatientSoignant {
  id: string;
  nom: string;
  prenom: string;
  niveauRisque: NiveauRisque;
  nbAlertesAujourdhui: number;
  derniereIntervention?: Date;
  derniereInterventionLibelle?: string;
  medecinReferent?: string;
  age?: number;
  sexe?: 'M' | 'F';
}
