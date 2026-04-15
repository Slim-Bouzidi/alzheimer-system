import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import keycloak from '../keycloak';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  id_token: string;
  session_state: string;
  scope: string;
}

export interface LoginError {
  error: string;
  error_description: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenUrl = 'http://localhost:8081/realms/alzheimer-realm/protocol/openid-connect/token';
  private clientId = 'alzheimer-angular-client';

  constructor(private http: HttpClient) { }

  /**
   * Authenticate directly against Keycloak's token endpoint.
   * This requires "Direct Access Grants" to be enabled on the Keycloak client.
   */
  login(email: string, password: string): Observable<TokenResponse> {
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('client_id', this.clientId)
      .set('username', email)
      .set('password', password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<TokenResponse>(this.tokenUrl, body.toString(), { headers }).pipe(
      catchError((error) => {
        if (error.status === 401 || error.status === 400) {
          return throwError(() => ({
            error: 'invalid_credentials',
            error_description: 'Invalid email or password. Please try again.'
          } as LoginError));
        }
        return throwError(() => ({
          error: 'server_error',
          error_description: 'Authentication service is unavailable. Please try again later.'
        } as LoginError));
      })
    );
  }

  /**
   * Store tokens in localStorage and reload to let main.ts handle the auth state.
   */
  async initKeycloakWithTokens(tokens: TokenResponse): Promise<boolean> {
    localStorage.setItem('kc_token', tokens.access_token);
    localStorage.setItem('kc_refreshToken', tokens.refresh_token);
    localStorage.setItem('kc_idToken', tokens.id_token);
    return true;
  }
}
