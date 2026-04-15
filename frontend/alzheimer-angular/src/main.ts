import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import keycloak from './app/keycloak';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

// User sync function
async function syncUserIfNeeded() {
  if (!keycloak.authenticated || !keycloak.tokenParsed) {
    return;
  }

  const keycloakId = keycloak.tokenParsed.sub;
  const email = keycloak.tokenParsed['email'];
  const roles = keycloak.tokenParsed['realm_access']?.['roles'] || [];
  
  // Filter out default Keycloak roles
  const userRole = roles.find((role: string) => 
    ['ADMIN', 'DOCTOR', 'CAREGIVER', 'PATIENT'].includes(role)
  ) || 'PATIENT'; // Default to PATIENT if no role found

  try {
    // Check if user exists in database
    const response = await fetch(`http://localhost:8080/api/users/by-keycloak-id/${keycloakId}`, {
      headers: {
        'Authorization': `Bearer ${keycloak.token}`
      }
    });

    if (response.status === 404) {
      // User doesn't exist, sync them
      console.log('User not found in database, syncing...');
      await fetch('http://localhost:8080/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keycloak.token}`
        },
        body: JSON.stringify({
          keycloakId: keycloakId,
          email: email,
          role: userRole
        })
      });
      console.log('User synced successfully');
    }
  } catch (error) {
    console.error('Error syncing user:', error);
  }
}

keycloak.init({
  onLoad: 'check-sso',
  checkLoginIframe: false,
  pkceMethod: 'S256'
}).then(async (authenticated) => {
  // Sync user if authenticated
  if (authenticated) {
    await syncUserIfNeeded();
  }

  // If not authenticated and trying to access protected routes, redirect to landing
  if (!authenticated && !window.location.pathname.includes('/landing') && !window.location.pathname.includes('/register')) {
    window.location.href = '/landing';
    return;
  }
  
  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
}).catch((error) => console.error('Keycloak init failed', error));
