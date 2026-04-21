import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CognitiveService, PatientCognitiveReport, ActivityResponse } from '../../services/cognitive.service';
import { PatientService, PatientProfile } from '../../core/services/patient.service';
import keycloak from '../../keycloak';

@Component({
  selector: 'app-patient-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patient-home.component.html',
  styleUrls: ['./patient-home.component.scss']
})
export class PatientHomeComponent implements OnInit {
  report: PatientCognitiveReport | null = null;
  profile: PatientProfile | null = null;
  recentActivity: ActivityResponse[] = [];
  userName: string = '';
  loadingReport = true;
  loadingProfile = true;

  readonly games = [
    { label: 'Reaction Time', desc: 'Test your visual reflexes', icon: 'pi-bolt', color: '#6366f1', route: '/patient/dashboard', fragment: 'reflex' },
    { label: 'Sequence Memory', desc: 'Remember an increasingly long pattern', icon: 'pi-table', color: '#0ea5e9', route: '/patient/dashboard', fragment: 'memory' },
    { label: 'Verbal Memory', desc: 'Keep words in short-term memory', icon: 'pi-book', color: '#10b981', route: '/patient/dashboard', fragment: 'verbal' },
  ];

  constructor(
    private cognitiveService: CognitiveService,
    private patientService: PatientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const patientId = keycloak.subject;
    const token = keycloak.tokenParsed as any;
    this.userName = token?.given_name || token?.preferred_username || 'there';

    if (patientId) {
      this.cognitiveService.getReport(patientId).subscribe({
        next: (r) => {
          this.report = r;
          this.loadingReport = false;
        },
        error: () => { this.loadingReport = false; }
      });

      this.cognitiveService.getPatientActivities(patientId).subscribe({
        next: (data) => {
          this.recentActivity = data
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5);
        },
        error: () => {}
      });
    }

    this.patientService.getMe().subscribe({
      next: (p) => { this.profile = p; this.loadingProfile = false; },
      error: () => { this.loadingProfile = false; }
    });
  }

  get scoreCategory(): string {
    return this.report?.cognitiveScore?.category?.replace(/_/g, ' ') ?? '';
  }

  get scoreColor(): string {
    const cat = this.report?.cognitiveScore?.category ?? '';
    if (cat.includes('SEVERE')) return '#ef4444';
    if (cat.includes('MODERATE')) return '#f59e0b';
    if (cat.includes('MILD')) return '#eab308';
    if (cat.includes('NORMAL')) return '#22c55e';
    return '#6366f1';
  }

  get hasCriticalAlert(): boolean {
    return this.report?.activeAlerts?.some(a => a.severity === 'CRITICAL') ?? false;
  }

  get alertCount(): number {
    return this.report?.activeAlerts?.length ?? 0;
  }

  getGameLabel(type: string): string {
    const t = type.toLowerCase();
    if (t === 'reflex') return 'Reaction Time';
    if (t === 'memory') return 'Sequence Memory';
    return 'Verbal Memory';
  }

  getGameIcon(type: string): string {
    const t = type.toLowerCase();
    if (t === 'reflex') return 'pi-bolt';
    if (t === 'memory') return 'pi-table';
    return 'pi-book';
  }

  goToWorkspace(): void {
    this.router.navigate(['/patient/dashboard']);
  }
}
