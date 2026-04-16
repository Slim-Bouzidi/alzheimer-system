import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id?: number;
  nom?: string;
  email?: string;
  mot_de_passe?: string;
  role?: string;
  telephone?: string;
  actif?: boolean;
  created_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  nom: string;
  email: string;
  role: string;
  telephone: string;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials);
  }

  register(user: User): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, user);
  }

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  getByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/role/${role}`, { headers: this.getHeaders() });
  }

  create(user: User): Observable<User> {
    return this.http.post<User>(this.baseUrl, user, { headers: this.getHeaders() });
  }

  update(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, user, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }
}
