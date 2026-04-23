import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn } from '@angular/router';
import keycloak from '../../keycloak';

async function ensureAuthenticated(redirectPath: string): Promise<boolean> {
  if (keycloak.authenticated) {
    return true;
  }

  await keycloak.login({
    redirectUri: `${window.location.origin}${redirectPath}`,
  });

  return false;
}

export const keycloakAuthGuard: CanActivateFn = (_route, state) => {
  return ensureAuthenticated(state.url);
};

export const keycloakAuthChildGuard: CanActivateChildFn = (_route, state) => {
  return ensureAuthenticated(state.url);
};