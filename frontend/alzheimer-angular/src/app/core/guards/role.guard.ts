import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import keycloak from '../../keycloak';

export const roleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as string[] | undefined;
  const excludedRoles = route.data['excludeRoles'] as string[] | undefined;

  const hasRole = (role: string): boolean => {
    const roleVariants = Array.from(new Set([
      role,
      role.toUpperCase(),
      role.toLowerCase(),
      role === 'DOCTOR' ? 'DOCTEUR' : '',
      role === 'DOCTEUR' ? 'DOCTOR' : '',
    ].filter(Boolean)));

    return roleVariants.some(variant => {
      const hasRealmRole = keycloak.hasRealmRole(variant) ||
        keycloak.hasRealmRole(variant.toUpperCase()) ||
        keycloak.hasRealmRole(variant.toLowerCase());

      const hasResourceRole = keycloak.hasResourceRole(variant) ||
        keycloak.hasResourceRole(variant.toUpperCase()) ||
        keycloak.hasResourceRole(variant.toLowerCase());

      return hasRealmRole || hasResourceRole;
    });
  };

  // Check if user has any excluded roles
  if (excludedRoles && excludedRoles.length > 0) {
    const hasExcludedRole = excludedRoles.some(role => hasRole(role));

    if (hasExcludedRole) {
      return router.createUrlTree(['/dashboard']);
    }
  }

  // Check if user has required roles (if specified)
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));

    if (!hasRequiredRole) {
      return router.createUrlTree(['/dashboard']);
    }
  }

  return true;
};
