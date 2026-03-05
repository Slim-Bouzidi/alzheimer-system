package assistancequotidienne2.assistancequotidienne2.DTOs;

import javax.validation.constraints.*;
import java.time.LocalDate;

/**
 * DTO for creating/updating a Rapport (medical report).
 * Contains Bean Validation annotations to enforce input constraints
 * consistent with the Angular front-end validation.
 */
public class RapportRequest {

    // ── Patient & Soignant references ──

    @NotNull(message = "Le patient est requis.")
    private PatientRef patient;

    @NotNull(message = "Le soignant est requis.")
    private SoignantRef soignant;

    // ── Report type ──

    @NotBlank(message = "Le type de rapport est requis.")
    @Pattern(regexp = "HEBDOMADAIRE|MENSUEL|MEDICAL|PERSONNALISE",
             message = "Type de rapport invalide.")
    private String typeRapport;
    // ── DTO pour un traitement (médicament) ──
    public static class TraitementRequest {
        @NotNull(message = "Le dosage est requis.")
        @Min(value = 1, message = "Le dosage doit être un entier positif.")
        private Integer dosage;
        // ... autres champs et validations ...
    }

    // ── Period ──

    @NotNull(message = "La date de début est requise.")
    private LocalDate periodeDebut;

    @NotNull(message = "La date de fin est requise.")
    private LocalDate periodeFin;

    // ── Content fields ──

    @Size(max = 500, message = "Le titre ne peut pas dépasser 500 caractères.")
    private String titre;

    @NotBlank(message = "Le contenu (traitements) est requis.")
    @Size(max = 10000, message = "Le contenu ne peut pas dépasser 10 000 caractères.")
    private String contenuTexte;

    @Size(max = 5000, message = "Les directives ne peuvent pas dépasser 5 000 caractères.")
    private String directives;

    @Size(max = 2000, message = "Les recommandations ne peuvent pas dépasser 2 000 caractères.")
    private String recommandations;

    // ── Status ──

    @Pattern(regexp = "BROUILLON|GENERE|ENVOYE|ARCHIVE",
             message = "Statut invalide.")
    private String statut;

    // ── Nested ref classes ──

    public static class PatientRef {
        @NotNull(message = "L'identifiant du patient est requis.")
        private Long id;

        public PatientRef() {}
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
    }

    public static class SoignantRef {
        @NotNull(message = "L'identifiant du soignant est requis.")
        private Long id;

        public SoignantRef() {}
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
    }

    // ── Constructors ──

    public RapportRequest() {}

    // ── Getters & Setters ──

    public PatientRef getPatient() { return patient; }
    public void setPatient(PatientRef patient) { this.patient = patient; }

    public SoignantRef getSoignant() { return soignant; }
    public void setSoignant(SoignantRef soignant) { this.soignant = soignant; }

    public String getTypeRapport() { return typeRapport; }
    public void setTypeRapport(String typeRapport) { this.typeRapport = typeRapport; }

    public LocalDate getPeriodeDebut() { return periodeDebut; }
    public void setPeriodeDebut(LocalDate periodeDebut) { this.periodeDebut = periodeDebut; }

    public LocalDate getPeriodeFin() { return periodeFin; }
    public void setPeriodeFin(LocalDate periodeFin) { this.periodeFin = periodeFin; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getContenuTexte() { return contenuTexte; }
    public void setContenuTexte(String contenuTexte) { this.contenuTexte = contenuTexte; }

    public String getDirectives() { return directives; }
    public void setDirectives(String directives) { this.directives = directives; }

    public String getRecommandations() { return recommandations; }
    public void setRecommandations(String recommandations) { this.recommandations = recommandations; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
}
