/**
 * Rapport de suivi structuré – créé par le médecin, référence obligatoire pour le soignant.
 * Traçabilité : date/heure création, identité médecin, signature et validation médicale.
 */

export type MomentPrise = 'matin' | 'midi' | 'soir' | 'autre';

/** Statut de la directive côté soignant (exécution quotidienne) */
export type StatutDirectiveSuivi = 'fait' | 'en_cours' | 'non_fait';

/** Un traitement prescrit – section Observance médicamenteuse (prioritaire) */
export interface TraitementPrescrit {
  id: string;
  nom: string;
  dosage: string;
  momentPrise: MomentPrise;
  detail?: string; // ex. "à jeun", "avec repas"
  attentesSuivi: string; // ex. "Vérifier prise effective, noter tout refus"
}

/** Directive générique (alimentation, vie sociale, consignes médicales) */
export interface DirectiveRapport {
  id: string;
  libelle: string;
  detail?: string;
  type: 'alimentation_hydratation' | 'vie_sociale_hygiene' | 'consigne_medicale';
}

/** Réponse du soignant à une directive – obligatoire commentaire si non_fait */
export interface ReponseDirectiveSoignant {
  directiveId: string;
  statut: StatutDirectiveSuivi;
  commentaireSoignant: string; // obligatoire si statut === 'non_fait'
  dateMaj?: Date;
}

/** Bloc Observance médicamenteuse (prioritaire) */
export interface SectionObservanceMedicamenteuse {
  traitements: TraitementPrescrit[];
  attentesGenerales: string; // ex. "Signaler tout oubli ou refus dans la fiche de transmission"
}

/** Bloc Alimentation et hydratation */
export interface SectionAlimentationHydratation {
  directives: DirectiveRapport[]; // ex. "Hydratation minimale 1,5 L/j", "Repas à heures fixes"
}

/** Bloc Vie sociale et hygiène de vie */
export interface SectionVieSocialeHygiene {
  directives: DirectiveRapport[];
}

/** Signature et validation médicale */
export interface SignatureValidationMedicale {
  medecinNom: string;
  medecinId?: string;
  dateValidation: Date;
  valide: boolean;
}

export interface RapportSuiviStructure {
  id: string;
  /** Identification complète du patient */
  patientId: string;
  patientNom: string;
  patientPrenom?: string;
  patientAge: number;
  /** Date et heure de création */
  dateCreation: Date;
  /** Identité du médecin */
  medecinNom: string;
  medecinId?: string;

  /**
   * Période du suivi hebdomadaire (7 jours consécutifs).
   * Référence obligatoire pour chaque jour de cette période dans la fiche de transmission.
   * Obligatoires pour tout nouveau rapport hebdomadaire.
   */
  dateDebut?: Date;
  dateFin?: Date;

  /** Section prioritaire : traitements prescrits et attentes de suivi */
  observanceMedicamenteuse: SectionObservanceMedicamenteuse;

  /** Directives alimentation et hydratation */
  alimentationHydratation: SectionAlimentationHydratation;

  /** Vie sociale et hygiène de vie */
  vieSocialeHygiene: SectionVieSocialeHygiene;

  /** Réponses du soignant par directive (fait / en cours / non fait + commentaire si non fait) */
  reponsesSoignant: ReponseDirectiveSoignant[];

  /** Signature et validation médicale – traçabilité */
  signatureValidation: SignatureValidationMedicale;

  /** Intégration suivi quotidien : rapport lié à la fiche de transmission du jour */
  luParSoignant?: boolean;
  dateLectureSoignant?: Date;
}

/** Vérifie si une date (YYYY-MM-DD) est dans la période [dateDebut, dateFin] du rapport */
export function dateDansPeriodeRapport(dateStr: string, r: RapportSuiviStructure): boolean {
  if (!r.dateDebut || !r.dateFin) return false;
  const d = dateStr;
  const debut = r.dateDebut instanceof Date ? r.dateDebut.toISOString().slice(0, 10) : String(r.dateDebut).slice(0, 10);
  const fin = r.dateFin instanceof Date ? r.dateFin.toISOString().slice(0, 10) : String(r.dateFin).slice(0, 10);
  return d >= debut && d <= fin;
}

/** Nombre de jours de la période (inclus). Retourne 0 si période absente. */
export function dureePeriodeJours(r: RapportSuiviStructure): number {
  if (!r.dateDebut || !r.dateFin) return 0;
  const deb = r.dateDebut instanceof Date ? r.dateDebut : new Date(r.dateDebut);
  const fin = r.dateFin instanceof Date ? r.dateFin : new Date(r.dateFin);
  return Math.round((fin.getTime() - deb.getTime()) / (24 * 3600 * 1000)) + 1;
}

/** Liste plate de toutes les directives du rapport (pour affichage soignant + fiche transmission) */
export function toutesDirectivesRapport(r: RapportSuiviStructure): Array<{ id: string; libelle: string; detail?: string; type: string }> {
  const out: Array<{ id: string; libelle: string; detail?: string; type: string }> = [];
  r.observanceMedicamenteuse.traitements.forEach(t => {
    out.push({
      id: t.id,
      libelle: `${t.nom} ${t.dosage} – ${t.momentPrise}`,
      detail: t.attentesSuivi,
      type: 'medicament'
    });
  });
  r.alimentationHydratation.directives.forEach(d => out.push({ ...d, type: d.type }));
  r.vieSocialeHygiene.directives.forEach(d => out.push({ ...d, type: d.type }));
  return out;
}

/** Synthèse des réponses soignant (pour affichage fin de semaine) */
export function syntheseReponsesRapport(r: RapportSuiviStructure): { fait: number; en_cours: number; non_fait: number; total: number } {
  const reponses = r.reponsesSoignant || [];
  return {
    fait: reponses.filter(x => x.statut === 'fait').length,
    en_cours: reponses.filter(x => x.statut === 'en_cours').length,
    non_fait: reponses.filter(x => x.statut === 'non_fait').length,
    total: reponses.length
  };
}
