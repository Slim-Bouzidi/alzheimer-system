import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RapportSuiviService } from '../../services/rapport-suivi.service';
import { RapportSuiviStructure, StatutDirectiveSuivi } from '../../models/rapport-suivi-structure.model';
import { FicheTransmission } from '../../models/fiche-transmission.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-fiche-transmission-hebdo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe, TranslateModule],
  templateUrl: './fiche-transmission-hebdo.component.html',
  styleUrls: ['../soignant-pages.css', './fiche-transmission-hebdo.component.css']
})
export class FicheTransmissionHebdoComponent implements OnInit {
  ficheForm: FormGroup;
  rapport: RapportSuiviStructure | null = null;
  patientId: string | null = null;
  dateDuJour: string = new Date().toISOString().split('T')[0];
  loading = false;
  sauvegardeEnCours = false;

  // Données mock pour le soignant connecté
  soignantConnecte = {
    id: 'soig-1',
    nom: 'Martin',
    prenom: 'Sophie',
    role: 'Infirmière'
  };

  constructor(
    private fb: FormBuilder,
    private rapportSuiviService: RapportSuiviService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {
    this.soignantConnecte.role = this.translate.instant('FICHE_TRANSMISSION.ROLE_NURSE');
    this.ficheForm = this.createForm();
  }

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('patientId');
    if (this.patientId) {
      this.chargerRapportDuJour();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      patientInfo: this.fb.group({
        nom: ['', Validators.required],
        prenom: ['', Validators.required],
        age: [0, [Validators.required, Validators.min(0)]],
        stadeAlzheimer: ['', Validators.required],
        dateDuJour: [this.dateDuJour, Validators.required],
        heureSaisie: [new Date(), Validators.required]
      }),
      soignantInfo: this.fb.group({
        nom: [this.soignantConnecte.nom, Validators.required],
        prenom: [this.soignantConnecte.prenom, Validators.required],
        role: [this.soignantConnecte.role, Validators.required]
      }),
      observanceMedicaments: this.fb.group({
        listeMedicaments: this.fb.array([]),
        totalPris: [0],
        totalPrevus: [0]
      }),
      alimentation: this.fb.group({
        appetit: ['bon', Validators.required],
        hydratation: ['suffisante', Validators.required],
        repasPris: [0, [Validators.required, Validators.min(0)]],
        repasPrevus: [3, [Validators.required, Validators.min(1)]],
        details: ['']
      }),
      vieSociale: this.fb.group({
        activitesRealisees: this.fb.array([]),
        interaction: ['normale', Validators.required],
        hygiene: ['autonome', Validators.required],
        sommeil: ['calme', Validators.required]
      }),
      suiviDirectives: this.fb.array([]),
      commentaireLibre: [''],
      signatureSoignant: [false, Validators.requiredTrue]
    });
  }

  private chargerRapportDuJour(): void {
    this.loading = true;
    const rapportData = this.rapportSuiviService.getRapportPourPatientEtDate(this.patientId!, this.dateDuJour);
    this.rapport = rapportData || null;
    
    if (this.rapport) {
      this.initialiserFormulaireAvecRapport();
    } else {
      // Si aucun rapport pour aujourd'hui, charger le dernier rapport disponible
      const dernierRapport = this.rapportSuiviService.getDernierRapportPourPatient(this.patientId!);
      if (dernierRapport && !this.rapport) {
        this.rapport = dernierRapport;
        this.initialiserFormulaireAvecRapport();
      }
    }
    this.loading = false;
  }

  private initialiserFormulaireAvecRapport(): void {
    if (!this.rapport) return;

    // Informations patient
    this.ficheForm.patchValue({
      patientInfo: {
        nom: this.rapport.patientNom,
        prenom: this.rapport.patientPrenom || '',
        age: this.rapport.patientAge,
        dateDuJour: this.dateDuJour,
        heureSaisie: new Date()
      }
    });

    // Initialiser les médicaments
    this.initialiserMedicaments();

    // Initialiser les directives médicales
    this.initialiserDirectives();
  }

  private initialiserMedicaments(): void {
    const medicamentsArray = this.ficheForm.get('observanceMedicaments.listeMedicaments') as FormArray;
    medicamentsArray.clear();

    if (this.rapport?.observanceMedicamenteuse.traitements) {
      this.rapport.observanceMedicamenteuse.traitements.forEach(traitement => {
        medicamentsArray.push(this.fb.group({
          nom: [traitement.nom, Validators.required],
          dosage: [traitement.dosage, Validators.required],
          moment: [traitement.momentPrise, Validators.required],
          pris: [false],
          commentaire: [''],
          id: [traitement.id]
        }));
      });
    }

    this.ficheForm.patchValue({
      observanceMedicaments: {
        totalPrevus: medicamentsArray.length
      }
    });
  }

  private initialiserDirectives(): void {
    const directivesArray = this.ficheForm.get('suiviDirectives') as FormArray;
    directivesArray.clear();

    if (this.rapport) {
      // Ajouter les directives alimentation/hydratation
      this.rapport.alimentationHydratation.directives.forEach(directive => {
        directivesArray.push(this.createDirectiveGroup(directive.id, directive.libelle));
      });

      // Ajouter les directives vie sociale/hygiène
      this.rapport.vieSocialeHygiene.directives.forEach(directive => {
        directivesArray.push(this.createDirectiveGroup(directive.id, directive.libelle));
      });
    }
  }

  private createDirectiveGroup(id: string, libelle: string): FormGroup {
    return this.fb.group({
      directiveId: [id, Validators.required],
      libelle: [libelle, Validators.required],
      reponse: ['', Validators.required],
      statut: ['en_cours' as StatutDirectiveSuivi, Validators.required]
    });
  }

  get medicamentsArray(): FormArray {
    return this.ficheForm.get('observanceMedicaments.listeMedicaments') as FormArray;
  }

  get directivesArray(): FormArray {
    return this.ficheForm.get('suiviDirectives') as FormArray;
  }

  get activitesArray(): FormArray {
    return this.ficheForm.get('vieSociale.activitesRealisees') as FormArray;
  }

  onMedicamentChange(index: number): void {
    const medicaments = this.medicamentsArray.value;
    const totalPris = medicaments.filter((m: any) => m.pris).length;
    this.ficheForm.patchValue({
      observanceMedicaments: {
        totalPris: totalPris
      }
    });
  }

  onStatutDirectiveChange(index: number): void {
    const directive = this.directivesArray.at(index);
    const statut = directive.get('statut')?.value;
    const reponseControl = directive.get('reponse');
    
    if (statut === 'non_fait') {
      reponseControl?.setValidators([Validators.required]);
    } else {
      reponseControl?.clearValidators();
    }
    reponseControl?.updateValueAndValidity();
  }

  ajouterActivite(): void {
    this.activitesArray.push(this.fb.control('', Validators.required));
  }

  supprimerActivite(index: number): void {
    this.activitesArray.removeAt(index);
  }

  calculerObservanceMedicaments(): number {
    const total = this.ficheForm.get('observanceMedicaments.totalPrevus')?.value || 1;
    const pris = this.ficheForm.get('observanceMedicaments.totalPris')?.value || 0;
    return Math.round((pris / total) * 100);
  }

  calculerObservanceRepas(): number {
    const prevus = this.ficheForm.get('alimentation.repasPrevus')?.value || 1;
    const pris = this.ficheForm.get('alimentation.repasPris')?.value || 0;
    return Math.round((pris / prevus) * 100);
  }

  onSubmit(): void {
    if (this.ficheForm.invalid) {
      this.marquerTousLesChampsTouched();
      return;
    }

    this.sauvegardeEnCours = true;
    
    // Simuler la sauvegarde
    setTimeout(() => {
      console.log('Fiche de transmission sauvegardée:', this.ficheForm.value);
      this.sauvegardeEnCours = false;
      this.router.navigate(['/soignant/rapports-hebdo']);
    }, 1500);
  }

  private marquerTousLesChampsTouched(): void {
    Object.keys(this.ficheForm.controls).forEach(key => {
      this.ficheForm.get(key)?.markAsTouched();
    });
  }

  retourListe(): void {
    this.router.navigate(['/soignant/rapports-hebdo']);
  }

  logout(): void {
    this.router.navigate(['/test']);
  }

  getStatutClass(statut: StatutDirectiveSuivi): string {
    switch (statut) {
      case 'fait': return 'statut-fait';
      case 'en_cours': return 'statut-encours';
      case 'non_fait': return 'statut-nonfait';
      default: return '';
    }
  }

  getStatutIcon(statut: StatutDirectiveSuivi): string {
    switch (statut) {
      case 'fait': return '✅';
      case 'en_cours': return '⏳';
      case 'non_fait': return '❌';
      default: return '';
    }
  }
}
