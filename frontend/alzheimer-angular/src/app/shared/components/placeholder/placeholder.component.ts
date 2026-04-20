import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px;color:#64748b;">
      <div style="width:80px;height:80px;background:#e0e7ff;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:2rem;">⊞</div>
      <h2 style="margin:0;font-size:1.4rem;font-weight:700;color:#1e293b;">{{ title }}</h2>
      <p style="margin:0;font-size:0.9rem;">This feature is currently under development.</p>
      <span style="background:#e0e7ff;color:#6366f1;padding:4px 14px;border-radius:999px;font-size:0.78rem;font-weight:600;">Coming Soon</span>
    </div>
  `
})
export class PlaceholderComponent {
  title = 'Dashboard';
  constructor(private route: ActivatedRoute) {
    this.title = this.route.snapshot.data['title'] || 'Dashboard';
  }
}
