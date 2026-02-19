import { Injectable, effect, signal } from '@angular/core';

const THEME_KEY = 'app-theme';
const DARK_CLASS = 'app-dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _isDark = signal<boolean>(this.loadFromStorage());

  readonly isDark = this._isDark.asReadonly();

  constructor() {
    effect(() => {
      this.applyTheme(this._isDark());
    });
  }

  toggle(): void {
    this._isDark.update(v => !v);
    localStorage.setItem(THEME_KEY, this._isDark() ? 'dark' : 'light');
  }

  private loadFromStorage(): boolean {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(dark: boolean): void {
    const el = document.documentElement;
    if (dark) {
      el.classList.add(DARK_CLASS);
    } else {
      el.classList.remove(DARK_CLASS);
    }
  }
}
