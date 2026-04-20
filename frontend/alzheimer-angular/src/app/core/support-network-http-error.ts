import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { translateOrFallback } from './i18n-fallback';
import { trySupportNetworkDemoSafeMessage } from './support-network-demo-error';

function pickBackendMessage(err: HttpErrorResponse): string | null {
  const body = err.error;
  if (body && typeof body === 'object') {
    const msgRaw =
      (body as { message?: unknown; error?: unknown; msg?: unknown; statusText?: unknown }).message
      ?? (body as { error?: unknown }).error
      ?? (body as { msg?: unknown }).msg
      ?? (body as { statusText?: unknown }).statusText;
    const msg = msgRaw != null ? String(msgRaw).trim() : '';
    const techRaw = (body as { technicalDetail?: unknown }).technicalDetail;
    const technical = techRaw != null ? String(techRaw).trim() : '';
    if (msg && technical) {
      return `${msg} — ${technical}`;
    }
    if (msg) {
      return msg;
    }
    if (technical) {
      return technical;
    }
    const errors = (body as { errors?: unknown }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0] as { defaultMessage?: unknown; message?: unknown } | string;
      if (typeof first === 'string' && first.trim().length > 0) return first.trim();
      if (typeof first === 'object' && first != null) {
        const structured = first.defaultMessage ?? first.message;
        if (structured != null && String(structured).trim().length > 0) return String(structured).trim();
      }
    }
  }
  if (typeof body === 'string' && body.trim().length > 0) return body.trim();
  return null;
}

export function getSupportNetworkHttpErrorMessage(
  err: HttpErrorResponse | undefined,
  translate: TranslateService,
  fallback: string
): string {
  const demo = trySupportNetworkDemoSafeMessage(err, translate);
  if (demo !== null) return demo;
  if (!err) return fallback;

  const backendMessage = pickBackendMessage(err);
  if (backendMessage) return backendMessage;

  if (err.status === 0) {
    return translateOrFallback(
      translate,
      'COMMON.ERR_BACKEND_UNREACHABLE',
      'Backend unreachable. Verify the service is running.'
    );
  }
  if (err.status === 400) {
    return translateOrFallback(translate, 'COMMON.ERR_BAD_REQUEST', 'Invalid request. Please check your input.');
  }
  if (err.status === 404) {
    return translateOrFallback(translate, 'COMMON.ERR_NOT_FOUND', 'Requested resource was not found.');
  }
  if (err.status === 503) {
    return translateOrFallback(
      translate,
      'COMMON.ERR_SERVICE_UNAVAILABLE',
      'Service unavailable. Please retry in a moment.'
    );
  }

  if (err.message && err.message.trim().length > 0) return err.message.trim();
  return fallback;
}
