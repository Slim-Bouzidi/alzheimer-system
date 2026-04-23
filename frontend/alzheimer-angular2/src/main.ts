import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import keycloak from './app/keycloak';
import { environment } from './environments/environment';

const PUBLIC_PATHS = new Set(['/register']);
let refreshTimerId: number | null = null;

/**
 * Sync the Keycloak user to the backend database if not already present.
 */
async function syncUserIfNeeded(): Promise<void> {
  if (!keycloak.authenticated || !keycloak.tokenParsed) return;

  const keycloakId = keycloak.tokenParsed.sub;
  const email = keycloak.tokenParsed['email'];
  const roles: string[] = keycloak.tokenParsed['realm_access']?.['roles'] || [];

  const userRole = roles.find((r: string) =>
    ['ADMIN', 'DOCTOR', 'CAREGIVER', 'PATIENT', 'SOIGNANT', 'LIVREUR'].includes(r)
  ) || 'PATIENT';
  const usersApiUrl = `${environment.apiUrl}/users`;

  try {
    const res = await fetch(`${usersApiUrl}/by-keycloak-id/${keycloakId}`, {
      headers: { Authorization: `Bearer ${keycloak.token}` },
    });

    if (res.status === 404) {
      console.log('User not found in database, syncing…');
      await fetch(`${usersApiUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keycloak.token}`,
        },
        body: JSON.stringify({ keycloakId, email, role: userRole }),
      });
      console.log('User synced successfully');
    }
  } catch (err) {
    console.error('Error syncing user:', err);
  }
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

function startTokenRefreshLoop(): void {
  if (typeof window === 'undefined' || refreshTimerId !== null) {
    return;
  }

  refreshTimerId = window.setInterval(() => {
    void keycloak.updateToken(60).catch((err) => {
      console.error('Scheduled token refresh failed', err);
    });
  }, 30000);
}

function bootstrapAngularApp(): void {
  startTokenRefreshLoop();
  platformBrowserDynamic()
    .bootstrapModule(AppModule, { ngZoneEventCoalescing: true })
    .catch((err) => console.error(err));
}

keycloak.onTokenExpired = () => {
  void keycloak.updateToken(60).catch((err) => {
    console.error('Token refresh on expiry failed', err);
    void keycloak.login({ redirectUri: window.location.href });
  });
};

keycloak
  .init({
    checkLoginIframe: false,
    pkceMethod: 'S256',
  })
  .then(async (authenticated) => {
    if (authenticated) {
      await syncUserIfNeeded();
      bootstrapAngularApp();
      return;
    }

    if (!isPublicRoute(window.location.pathname)) {
      await keycloak.login({ redirectUri: window.location.href });
      return;
    }

    bootstrapAngularApp();
  })
  .catch((error) => {
    console.error('Keycloak init failed', error);
  });
