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

/** Adds a harmless XMLHttpRequest hint for proxied API traffic without altering auth headers. */
@Injectable()
export class SupportNetworkApiInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!isSupportNetworkApiUrl(req.url)) {
      return next.handle(req);
    }
    const headers = req.headers.set('X-Requested-With', 'XMLHttpRequest');
    return next.handle(req.clone({ headers }));
  }
}
