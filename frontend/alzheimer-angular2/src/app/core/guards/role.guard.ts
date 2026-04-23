import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import keycloak from '../../keycloak';
import { AuthService } from '../../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const requiredRoles = route.data['roles'] as string[] | undefined;
  const excludedRoles = route.data['excludeRoles'] as string[] | undefined;

  const defaultRoles = ['offline_access', 'uma_authorization'];
  const isDefaultRole = (role: string): boolean =>
    defaultRoles.includes(role) || role.startsWith('default-roles-');

  if (!keycloak.authenticated) {
    void keycloak.login({ redirectUri: `${window.location.origin}${state.url}` });
    return false;
  }

  const hasRole = (role: string): boolean => {
    const normalizedRole = role.toUpperCase();
    return keycloak.hasRealmRole(normalizedRole)
      || keycloak.hasRealmRole(normalizedRole.toLowerCase())
      || keycloak.hasResourceRole(normalizedRole)
      || keycloak.hasResourceRole(normalizedRole.toLowerCase());
  };

  const userRoles = [
    ...(keycloak.realmAccess?.roles ?? []),
    ...Object.values(keycloak.resourceAccess ?? {}).flatMap((resource) => resource.roles ?? []),
  ].filter((role) => !isDefaultRole(role));

  const fallbackRoute = authService.getHomeRoute();

  if (excludedRoles?.length && excludedRoles.some(hasRole)) {
    console.warn('Access denied because of excluded role', { route: state.url, excludedRoles, userRoles });
    void router.navigateByUrl(fallbackRoute);
    return false;
  }

  if (requiredRoles?.length && !requiredRoles.some(hasRole)) {
    console.warn('Access denied because required role is missing', { route: state.url, requiredRoles, userRoles });
    void router.navigateByUrl(fallbackRoute);
    return false;
  }

  return true;
};
