import { Injectable, effect, signal } from '@angular/core';

const THEME_KEY = 'app-theme';
const DARK_CLASS = 'app-dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  // Always use light mode - dark mode is disabled
  private readonly _isDark = signal<boolean>(false);

  readonly isDark = this._isDark.asReadonly();

  constructor() {
    // Force light mode on initialization
    this.applyTheme(false);
    // Clear any stored dark mode preference
    localStorage.setItem(THEME_KEY, 'light');
    
    effect(() => {
      this.applyTheme(this._isDark());
    });
  }

  toggle(): void {
    // Dark mode toggle is disabled - always stay in light mode
    // This method is kept for backward compatibility but does nothing
  }

  private applyTheme(dark: boolean): void {
    const el = document.documentElement;
    // Always remove dark class to ensure light mode
    el.classList.remove(DARK_CLASS);
  }
}
