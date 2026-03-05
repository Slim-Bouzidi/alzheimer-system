package assistancequotidienne2.assistancequotidienne2.Controllers;

import assistancequotidienne2.assistancequotidienne2.Entities.RapportHebdomadaire;
import assistancequotidienne2.assistancequotidienne2.Entities.FicheTransmission;
import assistancequotidienne2.assistancequotidienne2.Entities.Notification;
import assistancequotidienne2.assistancequotidienne2.Entities.Patient;
import assistancequotidienne2.assistancequotidienne2.Entities.User;
import assistancequotidienne2.assistancequotidienne2.Services.NotificationWsService;
import assistancequotidienne2.assistancequotidienne2.Repositories.RapportHebdomadaireRepository;
import assistancequotidienne2.assistancequotidienne2.Repositories.FicheTransmissionRepository;
import assistancequotidienne2.assistancequotidienne2.Repositories.PatientRepository;
import assistancequotidienne2.assistancequotidienne2.Repositories.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rapports-hebdo")
public class RapportHebdomadaireController {

    @Autowired
    private RapportHebdomadaireRepository rapportHebdoRepository;

    @Autowired
    private FicheTransmissionRepository ficheRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationWsService notificationWsService;

    // CREATE
    @PostMapping
    public ResponseEntity<RapportHebdomadaire> create(@RequestBody RapportHebdomadaire rapport) {
        if (rapport.getPatient() != null && rapport.getPatient().getId() != null) {
            patientRepository.findById(rapport.getPatient().getId())
                    .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        }
        return ResponseEntity.ok(rapportHebdoRepository.save(rapport));
    }

    // READ ALL
    @GetMapping
    public ResponseEntity<List<RapportHebdomadaire>> getAll() {
        return ResponseEntity.ok(rapportHebdoRepository.findAll());
    }

    // READ BY ID
    @GetMapping("/{id}")
    public ResponseEntity<RapportHebdomadaire> getById(@PathVariable Long id) {
        RapportHebdomadaire rapport = rapportHebdoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rapport hebdomadaire non trouvé"));
        return ResponseEntity.ok(rapport);
    }

    // READ BY PATIENT
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<RapportHebdomadaire>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(rapportHebdoRepository.findByPatientIdOrderByDateDebutDesc(patientId));
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<RapportHebdomadaire> update(@PathVariable Long id, @RequestBody RapportHebdomadaire rapport) {
        RapportHebdomadaire existing = rapportHebdoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rapport hebdomadaire non trouvé"));

        existing.setDateDebut(rapport.getDateDebut());
        existing.setDateFin(rapport.getDateFin());
        existing.setFormulaireIdsJson(rapport.getFormulaireIdsJson());
        existing.setTauxObservanceMedicaments(rapport.getTauxObservanceMedicaments());
        existing.setTauxObservanceRepas(rapport.getTauxObservanceRepas());
        existing.setTauxObservanceRendezVous(rapport.getTauxObservanceRendezVous());
        existing.setIncidentsNotables(rapport.getIncidentsNotables());
        existing.setObservationsGenerales(rapport.getObservationsGenerales());
        existing.setPatientNom(rapport.getPatientNom());

        return ResponseEntity.ok(rapportHebdoRepository.save(existing));
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        rapportHebdoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // MARQUER COMME ENVOYE AU MEDECIN + NOTIFICATION
    @PatchMapping("/{id}/envoyer")
    public ResponseEntity<RapportHebdomadaire> marquerEnvoye(@PathVariable Long id) {
        RapportHebdomadaire rapport = rapportHebdoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rapport hebdomadaire non trouvé"));

        // Already sent?
        if (Boolean.TRUE.equals(rapport.getEnvoyeAuMedecin())) {
            return ResponseEntity.ok(rapport);
        }

        rapport.marquerEnvoye();
        RapportHebdomadaire saved = rapportHebdoRepository.save(rapport);

        // Create notification for the doctor (patient's soignant = médecin référent)
        try {
            Patient patient = rapport.getPatient();
            if (patient != null && patient.getSoignant() != null) {
                User medecin = patient.getSoignant();
                Notification notif = new Notification();
                notif.setDestinataire(medecin);
                notif.setExpediteur(rapport.getSoignant());
                notif.setPatient(patient);
                notif.setType("RAPPORT_HEBDO_ENVOYE");
                notif.setTitre("📊 Nouveau rapport hebdomadaire");
                String patientNom = patient.getNomComplet() != null ? patient.getNomComplet() : "Patient";
                String periode = "";
                if (rapport.getDateDebut() != null && rapport.getDateFin() != null) {
                    periode = " (du " + rapport.getDateDebut() + " au " + rapport.getDateFin() + ")";
                }
                notif.setMessage("Le soignant a envoyé un rapport hebdomadaire pour " + patientNom + periode + ". Consultez-le dans vos rapports patients.");
                notif.setReferenceId(saved.getId());
                notif.setReferenceType("RAPPORT_HEBDOMADAIRE");
                Notification savedNotif = notificationRepository.save(notif);
                notificationWsService.notifyDoctor(savedNotif);
            }
        } catch (Exception e) {
            // Don't fail the send if notification fails
            System.err.println("Erreur création notification rapport hebdo: " + e.getMessage());
        }

        return ResponseEntity.ok(saved);
    }

    // MARQUER COMME CONSULTE PAR LE MEDECIN
    @PatchMapping("/{id}/consulte")
    public ResponseEntity<RapportHebdomadaire> marquerConsulte(@PathVariable Long id) {
        RapportHebdomadaire rapport = rapportHebdoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rapport hebdomadaire non trouvé"));
        if (!Boolean.TRUE.equals(rapport.getConsulteParMedecin())) {
            rapport.marquerConsulte();
            rapport = rapportHebdoRepository.save(rapport);
        }
        return ResponseEntity.ok(rapport);
    }

    // CONSOLIDATION: Generate weekly report from daily fiches
    @PostMapping("/consolider/{patientId}")
    public ResponseEntity<RapportHebdomadaire> consolider(
            @PathVariable Long patientId,
            @RequestParam String debut,
            @RequestParam String fin) {

        LocalDate dateDebut = LocalDate.parse(debut);
        LocalDate dateFin = LocalDate.parse(fin);

        // Get all daily fiches for this patient in the period
        List<FicheTransmission> fiches = ficheRepository.findByPatientIdAndDateFicheBetween(patientId, dateDebut, dateFin);

        var patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));

        // Build the weekly report
        RapportHebdomadaire rapport = new RapportHebdomadaire();
        rapport.setPatient(patient);
        rapport.setPatientNom(patient.getNomComplet());
        rapport.setDateDebut(dateDebut);
        rapport.setDateFin(dateFin);

        // Collect fiche IDs as JSON array
        StringBuilder idsJson = new StringBuilder("[");
        for (int i = 0; i < fiches.size(); i++) {
            if (i > 0) idsJson.append(",");
            idsJson.append(fiches.get(i).getId());
        }
        idsJson.append("]");
        rapport.setFormulaireIdsJson(idsJson.toString());

        // Calculate observance rates from fiches (simplified)
        int totalFiches = fiches.size();
        if (totalFiches > 0) {
            // Basic rate: count fiches that are signed/sent
            long envoyes = fiches.stream().filter(f -> "envoye".equals(f.getStatut()) || "valide".equals(f.getStatut())).count();
            rapport.setTauxObservanceMedicaments((double) Math.round((double) envoyes / totalFiches * 100.0));
            rapport.setTauxObservanceRepas((double) Math.round((double) envoyes / totalFiches * 100.0));
            rapport.setTauxObservanceRendezVous(100.0);
        } else {
            rapport.setTauxObservanceMedicaments(0.0);
            rapport.setTauxObservanceRepas(0.0);
            rapport.setTauxObservanceRendezVous(0.0);
        }

        rapport.setObservationsGenerales("Rapport consolidé automatiquement à partir de " + totalFiches + " fiches de transmission.");
        rapport.setIncidentsNotables("");

        return ResponseEntity.ok(rapportHebdoRepository.save(rapport));
    }
}
