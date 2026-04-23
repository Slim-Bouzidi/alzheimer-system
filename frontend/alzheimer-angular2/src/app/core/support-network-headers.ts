import { HttpHeaders } from '@angular/common/http';

/**
 * Base headers for support-network `/api/**` calls.
 * The Authorization (Bearer) header is injected automatically by KeycloakAuthInterceptor
 * for all requests matching `/api/**` paths.
 */
export function supportNetworkHttpHeaders(): HttpHeaders {
  return new HttpHeaders({
    'Content-Type': 'application/json',
    Accept: 'application/json',
  });
}
