import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import keycloak from '../../keycloak';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as string[] | undefined;
  const excludedRoles = route.data['excludeRoles'] as string[] | undefined;

  // Keycloak default roles to ignore
  const defaultRoles = ['offline_access', 'uma_authorization'];
  
  // Filter function to exclude default Keycloak roles
  const isDefaultRole = (role: string): boolean => {
    return defaultRoles.includes(role) || role.startsWith('default-roles-');
  };

  const hasRole = (role: string): boolean => {
    const hasRealmRole = keycloak.hasRealmRole(role) || 
                         keycloak.hasRealmRole(role.toUpperCase()) ||
                         keycloak.hasRealmRole(role.toLowerCase());
    
    const hasResourceRole = keycloak.hasResourceRole(role) || 
                            keycloak.hasResourceRole(role.toUpperCase()) ||
                            keycloak.hasResourceRole(role.toLowerCase());
    
    return hasRealmRole || hasResourceRole;
  };

  // Get user's actual roles (excluding default Keycloak roles)
  const userRoles: string[] = [];
  if (keycloak.realmAccess?.roles) {
    userRoles.push(...keycloak.realmAccess.roles.filter(role => !isDefaultRole(role)));
  }
  if (keycloak.resourceAccess) {
    Object.values(keycloak.resourceAccess).forEach((resource: any) => {
      if (resource.roles) {
        userRoles.push(...resource.roles.filter((role: string) => !isDefaultRole(role)));
      }
    });
  }

  // Debug logging
  console.log('=== Role Guard Debug ===');
  console.log('Route:', state.url);
  console.log('Required roles:', requiredRoles);
  console.log('Excluded roles:', excludedRoles);
  console.log('User roles (filtered):', userRoles);
  console.log('Keycloak realm roles:', keycloak.realmAccess?.roles);
  console.log('Keycloak resource access:', keycloak.resourceAccess);

  // Check if user has any excluded roles
  if (excludedRoles && excludedRoles.length > 0) {
    const hasExcludedRole = excludedRoles.some(role => {
      const result = hasRole(role);
      console.log(`Checking excluded role '${role}':`, result);
      return result;
    });
    
    if (hasExcludedRole) {
      console.log(`❌ Access denied: User has excluded role from [${excludedRoles.join(', ')}]`);
      // Redirect to dashboard - a safe route with no role restrictions
      router.navigate(['/dashboard']);
      return false;
    }
  }

  // Check if user has required roles (if specified)
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => {
      const result = hasRole(role);
      console.log(`Checking required role '${role}':`, result);
      return result;
    });
    
    if (!hasRequiredRole) {
      console.log(`❌ Access denied: User doesn't have required role from [${requiredRoles.join(', ')}]`);
      // Redirect to dashboard - a safe route with no role restrictions
      router.navigate(['/dashboard']);
      return false;
    }
  }

  console.log('✅ Access granted');
  return true;
};
