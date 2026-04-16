export interface PatientResumeJour {
    patientId: string;
    date: string;
    medications: {
        total: number;
        pris: number;
        percentage: number;
        details: Array<{
            nom: string;
            statut: 'pris' | 'a_venir' | 'en_retard';
        }>;
    };
    meals: {
        total: number;
        pris: number;
        percentage: number;
        details: Array<{
            type: string; // 'Petit-déjeuner', 'Déjeuner', 'Dîner'
            statut: 'pris' | 'a_venir' | 'en_retard';
        }>;
    };
    activities: {
        total: number;
        realisees: number;
        percentage: number;
        details: Array<{
            nom: string;
            statut: 'fait' | 'a_faire' | 'en_retard';
        }>;
    };
    alertesCount: number;
}

export interface HistoriqueEntry {
    id: string;
    time: string; // HH:MM format
    type: 'medicament' | 'repas' | 'activite' | 'alerte' | 'intervention' | 'note' | 'chute' | 'fugue' | 'comportement' | 'zone_interdite';
    description: string;
    soignantNom: string;
    statut: string;
    icon: string; // Emoji icon
}

export interface Alerte {
    id: string;
    patientId: string;
    type: 'chute' | 'fugue' | 'comportement' | 'medicament' | 'autre';
    gravite: 'urgence' | 'moyenne' | 'faible';
    titre: string;
    description: string;
    dateHeure: Date;
    traitee: boolean;
    localisationGPS?: { lat: number; lng: number };
}

export interface PatientTendances {
    observanceMedicaments: { value: number; evolution: number }; // value in %, evolution in %
    qualiteSommeil: { value: number; evolution: number }; // value in hours
    participationActivites: { value: number; evolution: number }; // value in %
    nombreAlertes: { value: number; evolution: number }; // absolute numbers
}

export interface NoteMedicale {
    id: string;
    medecinNom: string;
    date: Date;
    contenu: string;
    directives: Array<{
        id: string;
        libelle: string;
        statut: 'applique' | 'en_cours' | 'non_applique';
    }>;
}
