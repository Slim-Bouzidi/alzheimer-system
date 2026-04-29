import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import keycloak from './app/keycloak';
import { environment } from './environments/environment';

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
    const usersApiBaseUrl = `${environment.apiUrl}/users`;

    // Check if user exists in database
    const response = await fetch(`${usersApiBaseUrl}/by-keycloak-id/${keycloakId}`, {
      headers: {
        'Authorization': `Bearer ${keycloak.token}`
      }
    });

    if (response.status === 404) {
      // User doesn't exist, sync them
      await fetch(`${usersApiBaseUrl}/sync`, {
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
  if (authenticated) {
    await syncUserIfNeeded();
  }

  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
}).catch((error) => console.error('Keycloak init failed', error));
