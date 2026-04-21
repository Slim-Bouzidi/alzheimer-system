import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChartModule } from 'primeng/chart';
import keycloak from '../../keycloak';
import { CognitiveService, ActivityResponse, PatientCognitiveReport } from '../../services/cognitive.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, ProgressBarModule, ToastModule, TableModule, ProgressSpinnerModule, ChartModule],
  providers: [MessageService, CognitiveService],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.scss']
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  
  // App States
  activeGame: 'reflex' | 'memory' | 'verbal' | 'none' = 'none';
  lastActiveGame: 'reflex' | 'memory' | 'verbal' | 'none' = 'none';
  showResultScreen: boolean = false;
  isSaving: boolean = false;
  isExiting: boolean = false; // Flag to prevent game logic during exit
  history: ActivityResponse[] = [];
  cognitiveReport: PatientCognitiveReport | null = null;
  isAnalyzing: boolean = false;
  showAllAlerts: boolean = false; // Toggle for alerts list
  showAllTrends: boolean = false; // Toggle for trends list
  private scrollPositionBeforeGame: number = 0; // Store scroll position before game starts
  
  // Multi-Chart State
  activeChart: 'reflex' | 'memory' | 'verbal' = 'reflex';
  reflexChart: any;
  memoryChart: any;
  verbalChart: any;
  chartOptions: any;

  // Reflex Game Vars
  reflexState: 'waiting' | 'ready' | 'feedback' | 'too-early' = 'waiting';
  reflexStartTime: number = 0;
  reflexAttempts: number[] = [];
  maxReflexAttempts: number = 5;
  reflexAverage: number = 0;
  lastAttemptResult: number = 0;
  reflexTimeout: any;

  // Memory Game Vars
  memorySequence: number[] = [];
  userSequence: number[] = [];
  memoryLevel: number = 1;
  isDisplayingSequence: boolean = false;
  activeMemoryButton: number | null = null;
  userActiveButton: number | null = null;
  finalMemoryLevel: number = 0;

  // Verbal Memory Vars
  wordBank: string[] = ['Apple', 'Banana', 'Orange', 'Carrot', 'Robot', 'Computer', 'Sun', 'Moon', 'Ocean', 'Forest', 'Mountain', 'River', 'Pencil', 'Library', 'Coffee', 'Garden', 'Bicycle', 'Camera', 'Diamond', 'Planet', 'Guitar', 'Bridge', 'Clock', 'Compass', 'Journey', 'Lantern', 'Meadow', 'Nebula', 'Oasis', 'Passage', 'Quartz', 'Rhythm', 'Summit', 'Temple', 'Umbra', 'Vortex', 'Window', 'Xenon', 'Yacht', 'Zephyr', 'Anchor', 'Beacon', 'Canyon', 'Desert', 'Echo', 'Falcon', 'Glacier', 'Harbor', 'Island', 'Jungle'];
  seenWords: Set<string> = new Set();
  currentWord: string = '';
  verbalScore: number = 0;
  lives: number = 3;

  constructor(
    private messageService: MessageService,
    private cognitiveService: CognitiveService
  ) {}

  ngOnInit(): void {
    this.loadHistory();
    this.loadCognitiveReport();
  }

  ngOnDestroy(): void {
    // Cleanup: ensure scroll lock is removed when component is destroyed
    clearTimeout(this.reflexTimeout);
    document.body.classList.remove('game-active');
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.style.width = 'auto';
    document.body.style.top = '';
  }

  loadCognitiveReport() {
    const patientId = keycloak.subject;
    if (patientId) {
      this.cognitiveService.getReport(patientId).subscribe({
        next: (report) => {
          this.cognitiveReport = report;
          console.log('Cognitive report loaded:', report);
        },
        error: (err) => console.error('Failed to load cognitive report', err)
      });
    }
  }

  runFullAnalysis() {
    const patientId = keycloak.subject;
    if (patientId && !this.isAnalyzing) {
      this.isAnalyzing = true;
      this.cognitiveService.runAnalysis(patientId).subscribe({
        next: (report) => {
          this.cognitiveReport = report;
          this.isAnalyzing = false;
          this.messageService.add({
            severity: 'success', 
            summary: 'Analysis Complete', 
            detail: 'Your cognitive health assessment has been updated.' 
          });
        },
        error: (err) => {
          this.isAnalyzing = false;
          this.messageService.add({
            severity: 'error', 
            summary: 'Analysis Failed', 
            detail: 'Could not complete the cognitive assessment.' 
          });
        }
      });
    }
  }

  resetAnalysis() {
    const patientId = keycloak.subject;
    if (patientId) {
      this.cognitiveService.resetAnalysis(patientId).subscribe({
        next: () => {
          this.cognitiveReport = null;
          this.loadCognitiveReport(); // This will load the 'Empty' state
          this.messageService.add({
            severity: 'info',
            summary: 'Analysis Reset',
            detail: 'Cognitive scores, trends, and alerts have been cleared. Your game history is preserved.'
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Reset Failed',
            detail: 'Could not clear the assessment data.'
          });
        }
      });
    }
  }

  acknowledgeAlert(alertId: number) {
    this.cognitiveService.acknowledgeAlert(alertId).subscribe({
      next: () => {
        if (this.cognitiveReport) {
          this.cognitiveReport.activeAlerts = this.cognitiveReport.activeAlerts.filter(a => a.id !== alertId);
        }
        this.messageService.add({ severity: 'success', summary: 'Dismissed', detail: 'Alert removed' });
      }
    });
  }

  dismissAllAlerts() {
    const alerts = this.cognitiveReport?.activeAlerts || [];
    alerts.forEach(alert => {
        this.cognitiveService.acknowledgeAlert(alert.id).subscribe();
    });
    if (this.cognitiveReport) {
        this.cognitiveReport.activeAlerts = [];
    }
    this.messageService.add({ severity: 'info', summary: 'Clear', detail: 'All alerts dismissed' });
  }

  toggleAlerts() {
    this.showAllAlerts = !this.showAllAlerts;
  }

  toggleTrends() {
    this.showAllTrends = !this.showAllTrends;
  }

  getAlertBadgeClass(): string {
    const alerts = this.cognitiveReport?.activeAlerts || [];
    if (alerts.some(a => a.severity === 'CRITICAL')) return 'badge-critical';
    if (alerts.some(a => a.severity === 'HIGH')) return 'badge-high';
    if (alerts.some(a => a.severity === 'MEDIUM')) return 'badge-medium';
    return '';
  }

  getAlertCountLabel(): string {
    const alerts = this.cognitiveReport?.activeAlerts || [];
    const count = alerts.length;
    if (count === 0) return '';
    const hasCritical = alerts.some(a => a.severity === 'CRITICAL');
    const pl = count !== 1 ? 's' : '';
    return `${count} ${hasCritical ? 'Critical ' : ''}Alert${pl}`;
  }

  loadHistory() {
    const patientId = keycloak.subject;
    if (patientId) {
      this.cognitiveService.getPatientActivities(patientId).subscribe({
        next: (data) => {
          this.history = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          this.initAllCharts();
        },
        error: (err) => console.error('Failed to load history', err)
      });
    }
  }

  deleteScore(id: number) {
    this.cognitiveService.deleteActivity(id).subscribe({
      next: () => {
        this.messageService.add({severity:'info', summary:'Deleted', detail: 'Score removed from records.'});
        this.loadHistory();
      },
      error: (err) => this.messageService.add({severity:'error', summary:'Error', detail: 'Could not delete score.'})
    });
  }

  initAllCharts() {
    this.initReflexChart();
    this.initMemoryChart();
    this.initVerbalChart();
  }

  // ── UI Helpers ──

  getGaugeOffset(score: number | undefined): number {
    if (score === undefined) return 440;
    const circumference = 440; // 2 * pi * 70
    return circumference - (score / 100 * circumference);
  }

  initReflexChart() {
    const scores = this.history.filter(h => h.gameType === 'reflex').map(h => h.score);
    const best = scores.length > 0 ? Math.min(...scores) : null;
    const labels = Array.from({length: 40}, (_, i) => (i * 10) + 100 + "ms");
    
    const distribution = labels.map((_, i) => {
        const x = (i * 10) + 100;
        return Math.exp(-Math.pow(x - 215, 2) / (2 * Math.pow(45, 2)));
    });

    const patientData = labels.map((_, i) => {
        const x = (i * 10) + 100;
        if (best && Math.abs(x - best) < 5) return 1.1;
        return 0;
    });

    this.reflexChart = this.createChartData('Reaction Time', labels, distribution, patientData);
    this.initOptions();
  }

  initMemoryChart() {
    const scores = this.history.filter(h => h.gameType === 'memory').map(h => h.score);
    const best = scores.length > 0 ? Math.max(...scores) : null;
    const labels = Array.from({length: 20}, (_, i) => "Lvl " + (i + 1));
    
    // Distribution centered around Level 8
    const distribution = labels.map((_, i) => {
        const x = i + 1;
        return Math.exp(-Math.pow(x - 8, 2) / (2 * Math.pow(3, 2)));
    });

    const patientData = labels.map((_, i) => {
        if (best && (i + 1) === best) return 1.1;
        return 0;
    });

    this.memoryChart = this.createChartData('Sequence Memory', labels, distribution, patientData);
  }

  initVerbalChart() {
    const scores = this.history.filter(h => h.gameType === 'verbal').map(h => h.score);
    const best = scores.length > 0 ? Math.max(...scores) : null;
    const labels = Array.from({length: 30}, (_, i) => (i * 10) + " pts");
    
    // Distribution centered around 60 pts
    const distribution = labels.map((_, i) => {
        const x = i * 10;
        return Math.exp(-Math.pow(x - 60, 2) / (2 * Math.pow(30, 2)));
    });

    const patientData = labels.map((_, i) => {
        const x = i * 10;
        if (best && Math.abs(x - best) < 5) return 1.1;
        return 0;
    });

    this.verbalChart = this.createChartData('Verbal Memory', labels, distribution, patientData);
  }

  createChartData(label: string, labels: any[], distribution: any[], patientDist: any[]) {
    return {
      labels: labels,
      datasets: [
        {
          label: 'Average Performance',
          data: distribution,
          fill: true,
          borderColor: '#94a3b8',
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: 'Your Best Score',
          data: patientDist,
          fill: false,
          borderColor: '#2563eb',
          backgroundColor: '#2563eb',
          borderWidth: 3,
          pointRadius: (ctx: any) => ctx.raw > 0 ? 6 : 0,
          pointBackgroundColor: '#2563eb'
        }
      ]
    };
  }

  initOptions() {
    this.chartOptions = {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            legend: { display: true, position: 'top', labels: { color: '#64748b', font: { weight: '600' } } },
            tooltip: { enabled: false }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45, font: { size: 10 } } },
            y: { display: false }
        }
    };
  }

  switchChart(type: 'reflex' | 'memory' | 'verbal') {
    this.activeChart = type;
  }

  // --- Reflex Game Logic ---
  startReflexGame() {
    // Save scroll position before starting game
    this.scrollPositionBeforeGame = window.scrollY;
    
    this.activeGame = 'reflex';
    this.lastActiveGame = 'reflex';
    this.showResultScreen = false;
    this.isSaving = false;
    this.reflexAttempts = [];
    
    // Prevent body scroll using CSS class
    document.body.classList.add('game-active');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    this.nextReflexRound();
  }

  nextReflexRound() {
    this.reflexState = 'waiting';
    const delay = Math.floor(Math.random() * 4000) + 1500; 
    this.reflexTimeout = setTimeout(() => {
      this.reflexState = 'ready';
      this.reflexStartTime = Date.now();
    }, delay);
  }

  handleReflexClick() {
    // Don't process clicks if showing results, saving, exiting, or if activeGame is being reset
    if (this.showResultScreen || this.isSaving || this.isExiting || this.activeGame !== 'reflex') {
      return;
    }

    if (this.reflexState === 'waiting') {
      clearTimeout(this.reflexTimeout);
      this.reflexState = 'too-early';
    } else if (this.reflexState === 'too-early') {
      // Small debounce to avoid accidental double clicks
      this.nextReflexRound();
    } else if (this.reflexState === 'ready') {
      const endTime = Date.now();
      const result = endTime - this.reflexStartTime;
      this.lastAttemptResult = result;
      this.reflexAttempts.push(result);
      this.reflexState = 'feedback';
    } else if (this.reflexState === 'feedback') {
      if (this.reflexAttempts.length >= this.maxReflexAttempts) {
        this.reflexAverage = Math.round(this.reflexAttempts.reduce((a, b) => a + b) / this.reflexAttempts.length);
        this.showResultScreen = true;
      } else {
        this.nextReflexRound();
      }
    }
  }

  // --- Memory Game Logic ---
  startMemoryGame() {
    // Save scroll position before starting game
    this.scrollPositionBeforeGame = window.scrollY;
    
    this.activeGame = 'memory';
    this.lastActiveGame = 'memory';
    this.showResultScreen = false;
    this.isSaving = false;
    this.memoryLevel = 1;
    this.memorySequence = [];
    
    // Prevent body scroll using CSS class
    document.body.classList.add('game-active');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    this.nextMemoryLevel();
  }

  nextMemoryLevel() {
    this.userSequence = [];
    this.memorySequence.push(Math.floor(Math.random() * 9));
    this.displaySequence();
  }

  async displaySequence() {
    this.isDisplayingSequence = true;
    for (let num of this.memorySequence) {
      this.activeMemoryButton = num;
      await new Promise(r => setTimeout(r, 600));
      this.activeMemoryButton = null;
      await new Promise(r => setTimeout(r, 200));
    }
    this.isDisplayingSequence = false;
  }

  handleMemoryClick(index: number) {
    if (this.isDisplayingSequence || this.showResultScreen) return;
    
    this.userActiveButton = index;
    setTimeout(() => this.userActiveButton = null, 250);

    this.userSequence.push(index);
    const currentIndex = this.userSequence.length - 1;

    if (this.userSequence[currentIndex] !== this.memorySequence[currentIndex]) {
      this.finalMemoryLevel = this.memoryLevel;
      this.showResultScreen = true;
      return;
    }

    if (this.userSequence.length === this.memorySequence.length) {
      this.memoryLevel++;
      setTimeout(() => this.nextMemoryLevel(), 800);
    }
  }

  // --- Verbal Memory Logic ---
  startVerbalGame() {
    // Save scroll position before starting game
    this.scrollPositionBeforeGame = window.scrollY;
    
    this.activeGame = 'verbal';
    this.lastActiveGame = 'verbal';
    this.showResultScreen = false;
    this.isSaving = false;
    this.verbalScore = 0;
    this.lives = 3;
    this.seenWords.clear();
    
    // Prevent body scroll using CSS class
    document.body.classList.add('game-active');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    this.nextVerbalWord();
  }

  nextVerbalWord() {
    if (this.seenWords.size > 0 && Math.random() < 0.5) {
      const seenArray = Array.from(this.seenWords);
      this.currentWord = seenArray[Math.floor(Math.random() * seenArray.length)];
    } else {
      const availableWords = this.wordBank.filter(w => !this.seenWords.has(w));
      if (availableWords.length === 0) {
          this.currentWord = this.wordBank[Math.floor(Math.random() * this.wordBank.length)];
      } else {
          this.currentWord = availableWords[Math.floor(Math.random() * availableWords.length)];
      }
    }
  }

  handleVerbalAnswer(answer: 'seen' | 'new') {
    const isSeen = this.seenWords.has(this.currentWord);
    
    if ((answer === 'seen' && isSeen) || (answer === 'new' && !isSeen)) {
      this.verbalScore++;
      this.seenWords.add(this.currentWord);
      this.nextVerbalWord();
    } else {
      this.lives--;
      this.seenWords.add(this.currentWord);
      if (this.lives <= 0) {
        this.showResultScreen = true;
      } else {
        this.nextVerbalWord();
      }
    }
  }

  // --- Shared Logic ---
  saveScore() {
    if (this.isSaving) return;
    this.isSaving = true;

    const gameType = this.activeGame;
    let score = 0;
    let duration = 0;

    if (gameType === 'reflex') { score = this.reflexAverage; duration = this.reflexAverage; }
    else if (gameType === 'memory') { score = this.finalMemoryLevel; }
    else if (gameType === 'verbal') { score = this.verbalScore; }
    
    const patientId = keycloak.subject || 'unknown';
    this.cognitiveService.saveActivity({
      patientId,
      gameType,
      score,
      durationMs: duration
    }).subscribe({
      next: (res) => {
        this.messageService.add({severity:'success', summary:'Saved!', detail: 'Your score has been stored.'});
        this.loadHistory();
        this.isSaving = false;
        // Exit game and restore scroll after successful save
        this.exitGame();
        // Refresh trends and report after each save
        this.runFullAnalysis();
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({severity:'error', summary:'Error', detail: 'Could not save score.'});
        // Still exit the game even on error to restore scroll
        this.exitGame();
      }
    });
  }

  getPercentile(score: number, type: string): string {
    const t = type.toLowerCase();
    if (t === 'reflex') {
      if (score < 150) return '99.2%';
      if (score < 180) return '85.4%';
      if (score < 210) return '60.1%';
      if (score < 230) return '45.8%';
      if (score < 260) return '30.2%';
      return '12.5%';
    } else if (t === 'memory') {
      if (score > 15) return '98.5%';
      if (score > 12) return '88.2%';
      if (score > 9) return '72.4%';
      if (score > 7) return '55.1%';
      if (score > 4) return '30.8%';
      return '15.4%';
    } else if (t === 'verbal') {
      if (score > 80) return '99.5%';
      if (score > 60) return '92.1%';
      if (score > 40) return '75.4%';
      if (score > 25) return '55.8%';
      if (score > 15) return '32.1%';
      return '18.4%';
    }
    return '--';
  }

  /** Returns numeric 0-100 value for percentile bar width */
  getPercentileRaw(score: number, type: string): number {
    const pctStr = this.getPercentile(score, type);
    if (pctStr === '--') return 0;
    return parseFloat(pctStr);
  }

  /** Returns CSS class for percentile bar color */
  getPctClass(score: number, type: string): string {
    const pct = this.getPercentileRaw(score, type);
    if (pct < 33) return 'pct-low';
    if (pct < 66) return 'pct-mid';
    return 'pct-high';
  }

  getPctColor(score: number, type: string): string {
    const cls = this.getPctClass(score, type);
    if (cls === 'pct-low') return '#ef4444';
    if (cls === 'pct-mid') return '#f59e0b';
    return '#22c55e';
  }

  tryAgain() {
    // Store which game to restart
    const gameToRestart = this.lastActiveGame;
    
    // First exit to clean up and restore scroll
    this.exitGame();
    
    // Then restart the game after a brief delay
    setTimeout(() => {
      if (gameToRestart === 'reflex') this.startReflexGame();
      else if (gameToRestart === 'memory') this.startMemoryGame();
      else if (gameToRestart === 'verbal') this.startVerbalGame();
    }, 50);
  }

  exitGame() {
    // Set exiting flag to prevent any game logic from running
    this.isExiting = true;
    
    // Clear any pending timeouts first
    clearTimeout(this.reflexTimeout);
    
    // Reset all game states IMMEDIATELY
    this.activeGame = 'none';
    this.showResultScreen = false;
    this.isSaving = false;
    
    // Reset reflex game state
    this.reflexState = 'waiting';
    this.reflexAttempts = [];
    
    // CRITICAL: Restore scrolling by removing ALL scroll-lock styles
    // Use requestAnimationFrame to ensure DOM updates are processed
    requestAnimationFrame(() => {
      // Remove the game-active class
      document.body.classList.remove('game-active');
      
      // Explicitly remove all inline styles that lock scrolling
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
      document.body.style.top = '';
      
      // Force a reflow to ensure styles are applied
      void document.body.offsetHeight;
      
      // Restore scroll position to where user was before game started
      window.scrollTo({ top: this.scrollPositionBeforeGame, behavior: 'auto' });
    });
    
    // Reset exiting flag after a short delay
    setTimeout(() => {
      this.isExiting = false;
    }, 100);
  }
}
