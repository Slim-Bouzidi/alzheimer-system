import { HttpHeaders } from '@angular/common/http';

/**
 * Headers for support-network `/api/**` calls. Demo mode: no Bearer token (avoids 401 / Basic
 * challenges from invalid or unwanted Authorization on gateways).
 */
export function supportNetworkHttpHeaders(): HttpHeaders {
  return new HttpHeaders({
    'Content-Type': 'application/json',
    Accept: 'application/json',
  });
}
