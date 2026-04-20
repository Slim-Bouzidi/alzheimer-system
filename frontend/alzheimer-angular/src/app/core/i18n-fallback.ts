import { TranslateService } from '@ngx-translate/core';

/** When translations are not loaded yet, ngx-translate returns the key unchanged. */
export function translateOrFallback(translate: TranslateService, key: string, fallback: string): string {
  try {
    const value = translate.instant(key);
    if (!value || value === key) {
      return fallback;
    }
    return value;
  } catch {
    return fallback;
  }
}
