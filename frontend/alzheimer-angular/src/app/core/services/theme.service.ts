import { Injectable, effect, signal } from '@angular/core';

const THEME_KEY = 'app-theme';
const DARK_CLASS = 'app-dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
<<<<<<< HEAD
  private readonly _isDark = signal<boolean>(this.loadFromStorage());
=======
  // Always use light mode - dark mode is disabled
  private readonly _isDark = signal<boolean>(false);
>>>>>>> cb099be (user ui update)

  readonly isDark = this._isDark.asReadonly();

  constructor() {
<<<<<<< HEAD
=======
    // Force light mode on initialization
    this.applyTheme(false);
    // Clear any stored dark mode preference
    localStorage.setItem(THEME_KEY, 'light');
    
>>>>>>> cb099be (user ui update)
    effect(() => {
      this.applyTheme(this._isDark());
    });
  }

  toggle(): void {
<<<<<<< HEAD
    this._isDark.update(v => !v);
    localStorage.setItem(THEME_KEY, this._isDark() ? 'dark' : 'light');
  }

  private loadFromStorage(): boolean {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
=======
    // Dark mode toggle is disabled - always stay in light mode
    // This method is kept for backward compatibility but does nothing
>>>>>>> cb099be (user ui update)
  }

  private applyTheme(dark: boolean): void {
    const el = document.documentElement;
<<<<<<< HEAD
    if (dark) {
      el.classList.add(DARK_CLASS);
    } else {
      el.classList.remove(DARK_CLASS);
    }
=======
    // Always remove dark class to ensure light mode
    el.classList.remove(DARK_CLASS);
>>>>>>> cb099be (user ui update)
  }
}
