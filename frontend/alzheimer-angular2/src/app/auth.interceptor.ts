import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import keycloak from './keycloak';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiRequest = req.url.startsWith('/api/') || req.url.includes('/api/');
  if (!isApiRequest) {
    return next(req);
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
      return next(authReq);
    })
  );
};
