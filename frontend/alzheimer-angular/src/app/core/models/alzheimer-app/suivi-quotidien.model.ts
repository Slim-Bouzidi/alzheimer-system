export interface FormulaireSuiviQuotidien {
  id: string;
  patientId: string;
  patientNom: string;
  date: string;
  soignantId: string;
  activitesRealisees: string;
  medicamentsPris: string;
  medicamentsRefuses: string;
  repasConsommes: string;
  quantiteRepas?: string;
  comportementsObserves: string;
  reactionExercicesCognitifs: string;
  observanceTraitement: 'oui' | 'partiel' | 'non';
  suiviRecommandations: 'oui' | 'partiel' | 'non';
  evolution: 'amelioration' | 'stabilite' | 'deterioration';
  commentaires: string;
  envoye: boolean;
  /** Observance des 4 médicaments Alzheimer + effets observés */
  donepezil?: string;
  rivastigmine?: string;
  galantamine?: string;
  memantine?: string;
  effetsMedicamentsObserves?: string;
  /** Activités thérapeutiques réalisées */
  activitesArtistiques?: string;
  activitesCorporelles?: string;
  activitesCognitives?: string;
  /** Facteurs de risque cardiovasculaires (si surveillés) */
  tensionArterielle?: string;
  glycemie?: string;
  cholesterol?: string;
  /** Symptômes selon le stade (léger: oublis/perte d'objets, modéré: reconnaissance/autonomie, sévère: perte mémoire/gestes) */
  symptomesStade?: string;
  /** État psychologique et troubles de l'humeur */
  etatPsychologiqueHumeur?: string;
  /** Vie sociale (interactions, visites) */
  vieSociale?: string;
  /** Hygiène de vie (activité physique, alimentation, tabac/alcool) */
  hygieneVie?: string;
  /** Évaluation de la réponse aux conseils du médecin */
  reponseConseilsMedecin?: string;
}
