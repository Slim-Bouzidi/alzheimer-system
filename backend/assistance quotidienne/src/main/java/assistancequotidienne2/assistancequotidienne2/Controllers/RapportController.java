package assistancequotidienne2.assistancequotidienne2.Controllers;

import assistancequotidienne2.assistancequotidienne2.DTOs.RapportRequest;
import assistancequotidienne2.assistancequotidienne2.Entities.*;
import assistancequotidienne2.assistancequotidienne2.Repositories.RapportRepository;
import assistancequotidienne2.assistancequotidienne2.Repositories.PatientRepository;
import assistancequotidienne2.assistancequotidienne2.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/rapports")
public class RapportController {

    @Autowired
    private RapportRepository rapportRepository;
    
    @Autowired
    private PatientRepository patientRepository;

    @Autowired(required = false)
    private UserRepository userRepository;

    // CREATE — with @Valid DTO validation
    @PostMapping
    public ResponseEntity<Rapport> create(@Valid @RequestBody RapportRequest request) {
        Patient patient = patientRepository.findById(request.getPatient().getId())
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));

        // Period consistency check (server-side)
        if (request.getPeriodeFin().isBefore(request.getPeriodeDebut())) {
            throw new IllegalArgumentException("La date de fin doit être postérieure à la date de début.");
        }

        Rapport rapport = new Rapport();
        rapport.setPatient(patient);

        // Resolve soignant if possible
        if (request.getSoignant() != null && request.getSoignant().getId() != null && userRepository != null) {
            userRepository.findById(request.getSoignant().getId()).ifPresent(rapport::setSoignant);
        }

        rapport.setTypeRapport(TypeRapport.valueOf(request.getTypeRapport()));
        rapport.setPeriodeDebut(request.getPeriodeDebut());
        rapport.setPeriodeFin(request.getPeriodeFin());
        rapport.setTitre(request.getTitre());
        rapport.setContenuTexte(request.getContenuTexte());
        rapport.setDirectives(request.getDirectives());
        rapport.setRecommandations(request.getRecommandations());
        if (request.getStatut() != null) {
            rapport.setStatut(StatutRapport.valueOf(request.getStatut()));
        }
        
        return ResponseEntity.ok(rapportRepository.save(rapport));
    }

    // READ ALL
    @GetMapping
    public ResponseEntity<List<Rapport>> getAll() {
        return ResponseEntity.ok(rapportRepository.findAll());
    }

    // READ BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Rapport> getById(@PathVariable Long id) {
        Rapport rapport = rapportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé"));
        return ResponseEntity.ok(rapport);
    }

    // READ BY PATIENT
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Rapport>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(rapportRepository.findByPatientIdOrderByDateGenerationDesc(patientId));
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Rapport> update(@PathVariable Long id, @RequestBody Rapport rapport) {
        Rapport existing = rapportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé"));
        
        existing.setTitre(rapport.getTitre());
        existing.setContenuTexte(rapport.getContenuTexte());
        existing.setDirectives(rapport.getDirectives());
        existing.setRecommandations(rapport.getRecommandations());
        existing.setStatut(rapport.getStatut());

        if (rapport.getTypeRapport() != null) existing.setTypeRapport(rapport.getTypeRapport());
        if (rapport.getPeriodeDebut() != null) existing.setPeriodeDebut(rapport.getPeriodeDebut());
        if (rapport.getPeriodeFin() != null) existing.setPeriodeFin(rapport.getPeriodeFin());
        if (rapport.getTauxObservance() != null) existing.setTauxObservance(rapport.getTauxObservance());
        if (rapport.getQualiteSommeil() != null) existing.setQualiteSommeil(rapport.getQualiteSommeil());
        if (rapport.getNbAlertes() != null) existing.setNbAlertes(rapport.getNbAlertes());
        if (rapport.getNbInterventions() != null) existing.setNbInterventions(rapport.getNbInterventions());
        if (rapport.getNbComportementsAnormaux() != null) existing.setNbComportementsAnormaux(rapport.getNbComportementsAnormaux());
        
        return ResponseEntity.ok(rapportRepository.save(existing));
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        rapportRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // MARQUER COMME LU PAR SOIGNANT
    @PatchMapping("/{id}/lu")
    public ResponseEntity<Rapport> marquerLuParSoignant(@PathVariable Long id) {
        Rapport rapport = rapportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé"));

        rapport.marquerLuParSoignant();
        return ResponseEntity.ok(rapportRepository.save(rapport));
    }

    // MARQUER COMME ENVOYE
    @PatchMapping("/{id}/envoyer")
    public ResponseEntity<Rapport> marquerEnvoye(@PathVariable Long id) {
        Rapport rapport = rapportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé"));
        
        rapport.marquerEnvoye();
        return ResponseEntity.ok(rapportRepository.save(rapport));
    }
}
