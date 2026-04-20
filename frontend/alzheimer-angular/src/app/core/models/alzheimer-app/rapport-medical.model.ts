/** Directive issue d'un rapport de consultation (à exécuter par le soignant) */
export type TypeDirective = 'rappel_medicament' | 'rappel_repas' | 'rappel_rendez_vous';

export type StatutDirective = 'non_lu' | 'lu' | 'en_cours' | 'execute' | 'reporter';

export interface Directive {
  id: string;
  rapportId: string;
  type: TypeDirective;
  libelle: string;
  detail: string;
  statut: StatutDirective;
  patientId: string;
  patientNom: string;
  dateLimite?: Date;
  rappelId?: string; // si un rappel a été créé à partir de cette directive
}

export interface RapportMedical {
  id: string;
  patientId: string;
  patientNom: string;
  medecinNom: string;
  dateConsultation: Date;
  dateReception: Date;
  resume: string;
  directives: Directive[];
  lu: boolean;
}
