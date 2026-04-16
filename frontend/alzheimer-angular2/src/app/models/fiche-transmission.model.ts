export interface FicheTransmission {
    id: string;
    patientId: string;
    soignantId: string;
    dateCreation: Date;
    dateEnvoi?: Date;
    statut: 'brouillon' | 'envoye' | 'valide';

    // 1. Informations Générales
    patientInfo: {
        nom: string;
        prenom: string;
        age: number;
        dateDuJour: Date;
        heureSaisie: Date;
    };
    soignantInfo: {
        nom: string;
        prenom: string;
        role: string;
    };

    // 2. Observance Médicamenteuse
    observanceMedicaments: {
        listeMedicaments: {
            nom: string;
            dosage: string;
            moment: 'matin' | 'midi' | 'soir';
            pris: boolean;
            commentaire?: string; // Si non pris
        }[];
        totalPris: number; // Calculé
        totalPrevus: number; // Calculé
    };

    // 3. Alimentation et Hydratation
    alimentation: {
        appetit: 'bon' | 'moyen' | 'faible' | 'refus';
        hydratation: 'suffisante' | 'insuffisante';
        repasPris: number;
        repasPrevus: number;
        details: string;
    };

    // 4. Vie Sociale et Hygiène
    vieSociale: {
        activitesRealisees: string[];
        interaction: 'normale' | 'retrait' | 'conflit';
        hygiene: 'autonome' | 'aide_partielle' | 'aide_totale';
        sommeil: 'calme' | 'agité' | 'insomnie';
    };

    // 7. Réponse aux directives médicales
    suiviDirectives: {
        directiveId: string;
        reponse: string;
        statut: 'fait' | 'non_fait' | 'en_cours';
    }[];

    // Validation
    signatureSoignant: boolean;
    commentaireLibre: string;
}
