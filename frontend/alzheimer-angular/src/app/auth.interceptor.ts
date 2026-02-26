import { HttpInterceptorFn } from '@angular/common/http';
import keycloak from './keycloak';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = keycloak.token;

  if (token) {
    if (req.url.includes('cognitive-activities')) {
      console.log('Attaching JWT to cognitive-service request:', req.url);
    }
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
