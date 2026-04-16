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
    // Disabled: Force light mode
  }

  private loadFromStorage(): boolean {
    return false; // Always light mode
  }

  private applyTheme(dark: boolean): void {
    const el = document.documentElement;
    el.classList.remove(DARK_CLASS); // Ensure class is never added
  }
}
