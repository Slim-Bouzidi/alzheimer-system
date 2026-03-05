import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Some dependencies expect Node.js globals. Provide minimal polyfills for the browser.
(window as any).global = window;
(window as any).process = (window as any).process || { env: {} };

import('./app/keycloak')
  .then(({ default: keycloak }) => {
    return keycloak
      .init({
        onLoad: 'login-required',
        checkLoginIframe: false,
      })
      .then((authenticated: boolean) => {
        if (authenticated) {
          console.log('Keycloak authenticated, bootstrapping Angular...');

          // Auto-refresh token before expiry
          setInterval(() => {
            keycloak.updateToken(60).catch(() => {
              console.warn('Token refresh failed, re-login required');
              keycloak.login();
            });
          }, 30000);

          return platformBrowserDynamic().bootstrapModule(AppModule, {
            ngZoneEventCoalescing: true,
          });
        }

        console.warn('Not authenticated, redirecting to Keycloak login...');
        keycloak.login();
        return undefined;
      });
  })
  .catch((err: any) => {
    console.error('Keycloak init failed:', err);
    // Fallback: allow app to start even if Keycloak is down/misconfigured
    platformBrowserDynamic().bootstrapModule(AppModule, {
      ngZoneEventCoalescing: true,
    }).catch(e => console.error(e));
  });
