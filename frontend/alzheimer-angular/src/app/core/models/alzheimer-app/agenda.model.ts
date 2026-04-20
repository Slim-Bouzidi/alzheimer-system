export type StatutAgenda = 'fait' | 'en_attente' | 'en_retard';

export type TypeEvenementAgenda = 'medicament' | 'repas' | 'activite' | 'rendez_vous';

export interface EvenementAgenda {
  id: string;
  type: TypeEvenementAgenda;
  heure: string;
  titre: string;
  detail?: string;
  patientId: string;
  patientNom: string;
  statut: StatutAgenda;
  rappelId?: string;
  date: Date;
}
