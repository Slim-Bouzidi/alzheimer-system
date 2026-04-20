/** Gravité pour code couleur: rouge=urgence/chute/fugue, orange=comportement anormal, jaune=zone interdite */
export type GraviteAlerte = 'URGENCE' | 'COMPORTEMENT' | 'ZONE_INTERDITE';

export type StatutAlerte = 'NOUVELLE' | 'EN_COURS' | 'TRAITEE';

export interface Alerte {
  id: string;
  patientId: string;
  patientNom: string;
  type: string; // chute, fugue, urgence, comportement_anormal, zone_interdite
  gravite: GraviteAlerte;
  statut: StatutAlerte;
  message: string;
  date: Date;
  lieu?: string;
  interventionId?: string;
}
