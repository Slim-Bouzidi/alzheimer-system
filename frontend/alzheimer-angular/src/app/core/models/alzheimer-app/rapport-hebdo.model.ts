export interface RapportHebdomadaire {
  id: string;
  patientId: string;
  patientNom: string;
  soignantId: string;
  dateDebut: string;
  dateFin: string;
  formulaireIds: string[];
  tauxObservanceMedicaments: number;
  tauxObservanceRepas: number;
  tauxObservanceRendezVous: number;
  incidentsNotables: string;
  observationsGenerales: string;
  envoyeAuMedecin: boolean;
  dateEnvoi?: Date;
}
