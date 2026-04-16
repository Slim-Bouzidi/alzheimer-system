export type StatutNotification = 'a_faire' | 'fait' | 'reporter' | 'probleme_rencontre';

export interface NotificationTache {
  id: string;
  rappelId: string;
  type: 'medicament' | 'repas' | 'rendez_vous';
  titre: string;
  message: string;
  heure: string;
  date: Date;
  patientId: string;
  patientNom: string;
  statut: StatutNotification;
  dateTraite?: Date;
}
