import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import keycloak from '../../keycloak';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const requiredRole = route.data['role'] as string;

  if (!requiredRole) return true;

  const hasRole = (role: string) => 
    keycloak.hasRealmRole(role) || 
    keycloak.hasResourceRole(role) || 
    keycloak.hasRealmRole(role.toUpperCase()) || 
    keycloak.hasResourceRole(role.toUpperCase());

  if (hasRole(requiredRole)) {
    return true;
  }

  // Redirect to home if unauthorized
  router.navigate(['/']);
  return false;
};
