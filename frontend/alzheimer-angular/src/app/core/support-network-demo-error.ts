import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { translateOrFallback } from './i18n-fallback';

const GENERIC_FALLBACK = 'Unable to load data.';

/**
 * Demo mode for support-network: never surface auth/HTML errors; return a single generic message.
 */
export function trySupportNetworkDemoSafeMessage(
  err: HttpErrorResponse | undefined,
  translate: TranslateService
): string | null {
  if (!err) return null;
  const generic = translateOrFallback(translate, 'COMMON.UNABLE_LOAD_DATA', GENERIC_FALLBACK);
  if (err.status === 401 || err.status === 403) {
    return generic;
  }
  const body = err.error;
  if (typeof body === 'string') {
    const t = body.trim();
    if (!t) return null;
    if (t.startsWith('<') || /<!doctype/i.test(t)) {
      return generic;
    }
    if (/unauthorized|forbidden|se connecter|basic auth|www-authenticate/i.test(t)) {
      return generic;
    }
  }
  if (body && typeof body === 'object') {
    const m = (body as { message?: unknown }).message;
    if (m !== undefined && m !== null) {
      const s = String(m);
      if (/unauthorized|forbidden|se connecter|basic auth/i.test(s)) {
        return generic;
      }
      if (s === generic || s === GENERIC_FALLBACK) {
        return generic;
      }
    }
  }
  return null;
}
