import { HttpInterceptorFn } from '@angular/common/http';
<<<<<<< HEAD
=======
import { catchError, throwError } from 'rxjs';
>>>>>>> cb099be (user ui update)
import keycloak from './keycloak';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = keycloak.token;

  if (token) {
<<<<<<< HEAD
=======
    if (req.url.includes('cognitive-activities')) {
      console.log('Attaching JWT to cognitive-service request:', req.url);
    }
>>>>>>> cb099be (user ui update)
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

<<<<<<< HEAD
  return next(req);
=======
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        keycloak.login();
      }
      return throwError(() => error);
    })
  );
>>>>>>> cb099be (user ui update)
};
