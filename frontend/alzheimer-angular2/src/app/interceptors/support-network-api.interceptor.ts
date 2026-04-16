import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

/** Matches dev proxy `/api/**` and absolute URLs that target the support-network API. */
function isSupportNetworkApiUrl(url: string): boolean {
  if (!url) return false;
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : url;
    return path.includes('/api/');
  } catch {
    return url.includes('/api/');
  }
}

/**
 * Demo mode: pass-through only — no TranslateService / no catchError here (avoids NG0200:
 * HttpClient → interceptors → TranslateService → TranslateHttpLoader → HttpClient).
 *
 * Adds {@code X-Requested-With: XMLHttpRequest} and strips {@code Authorization} on /api/** so
 * gateways do not see malformed Bearer tokens.
 */
@Injectable()
export class SupportNetworkApiInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!isSupportNetworkApiUrl(req.url)) {
      return next.handle(req);
    }
    let headers = req.headers.set('X-Requested-With', 'XMLHttpRequest');
    if (headers.has('Authorization')) {
      headers = headers.delete('Authorization');
    }
    return next.handle(req.clone({ headers }));
  }
}
