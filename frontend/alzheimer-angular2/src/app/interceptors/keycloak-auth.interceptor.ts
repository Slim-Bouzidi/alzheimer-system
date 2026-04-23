import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { from, Observable, switchMap } from 'rxjs';
import keycloak from '../keycloak';

@Injectable()
export class KeycloakAuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isApiRequest = req.url.startsWith('/api/') || req.url.includes('/api/');
    if (!isApiRequest) {
      return next.handle(req);
    }
    return from(
      keycloak.authenticated
        ? keycloak.updateToken(30).catch(() => false)
        : Promise.resolve(false)
    ).pipe(
      switchMap(() => {
        const token = keycloak.token;
        const authReq = token
          ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : req;
        return next.handle(authReq);
      })
    );
  }
}
