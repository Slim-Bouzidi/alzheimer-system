import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query } from '@angular/animations';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="placeholder-container" [@pageAnimations]>
      <div class="glass-box">
        <div class="icon-container">
          <i [class]="'pi ' + icon()"></i>
          <div class="pulse-ring"></div>
        </div>
        <h1 class="title">{{ title() }}</h1>
        <p class="subtitle">This feature is currently under development.</p>
        <div class="status-badge">
          <span class="dot"></span>
          Coming Soon
        </div>
        
        <div class="demo-content">
          <div class="skeleton-line" style="width: 80%"></div>
          <div class="skeleton-line" style="width: 60%"></div>
          <div class="skeleton-line" style="width: 70%"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .placeholder-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 120px);
      padding: 2rem;
    }

    .glass-box {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(16px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 24px;
      padding: 4rem;
      text-align: center;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }

    .icon-container {
      position: relative;
      width: 80px;
      height: 80px;
      background: #dbeafe;
      color: #2563eb;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      margin-bottom: 1rem;

      i {
        z-index: 2;
      }
    }

    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 20px;
      border: 2px solid #2563eb;
      animation: pulse 2s infinite;
      opacity: 0;
    }

    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(1.5); opacity: 0; }
    }

    .title {
      font-size: 2rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 1.1rem;
      color: #64748b;
      margin: 0;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(37, 99, 235, 0.1);
      color: #2563eb;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.875rem;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #2563eb;
        animation: blink 1.5s infinite;
      }
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .demo-content {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .skeleton-line {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      opacity: 0.3;
    }
  `],
  animations: [
    trigger('pageAnimations', [
      transition(':enter', [
        query('.glass-box', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          animate('0.6s cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
        ])
      ])
    ])
  ]
})
export class PlaceholderComponent implements OnInit {
  private route = inject(ActivatedRoute);

  title = signal('Feature Coming Soon');
  icon = signal('pi-rocket');

  ngOnInit() {
    this.route.data.subscribe(data => {
      if (data['title']) this.title.set(data['title']);
      if (data['icon']) this.icon.set(data['icon']);
    });
  }
}
