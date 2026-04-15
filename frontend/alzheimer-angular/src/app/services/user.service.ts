import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface UserRegistrationRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UserResponse {
  id: number;
  keycloakId: string;
  email: string;
  role: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  register(request: UserRegistrationRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/register`, request);
  }

  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`);
  }

  getUserByKeycloakId(keycloakId: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/by-keycloak-id/${keycloakId}`);
  }

  getAllUsers(role?: string): Observable<UserResponse[]> {
    const url = role ? `${this.apiUrl}?role=${role}` : this.apiUrl;
    return this.http.get<UserResponse[]>(url);
  }
}
