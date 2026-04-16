import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { User, UserRole, LoginRequest, LoginResponse } from '../models/user.model';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Utilisateurs de démonstration
  private mockUsers: User[] = [
    {
      id: 1,
      email: 'admin@alzheimer.fr',
      firstName: 'Jean',
      lastName: 'Dupont',
      role: UserRole.ADMIN,
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date()
    },
    {
      id: 2,
      email: 'soignant@alzheimer.fr',
      firstName: 'Marie',
      lastName: 'Martin',
      role: UserRole.SOIGNANT,
      createdAt: new Date('2024-01-20'),
      lastLogin: new Date()
    },
    {
      id: 5,
      email: 'doctor@alzheimer.fr',
      firstName: 'Marc',
      lastName: 'Lefebvre',
      role: UserRole.DOCTEUR,
      createdAt: new Date('2024-01-25'),
      lastLogin: new Date()
    },
    {
      id: 3,
      email: 'aidant@alzheimer.fr',
      firstName: 'Pierre',
      lastName: 'Bernard',
      role: UserRole.AIDANT,
      createdAt: new Date('2024-02-01'),
      lastLogin: new Date()
    },
    {
      id: 4,
      email: 'patient@alzheimer.fr',
      firstName: 'Alice',
      lastName: 'Robert',
      role: UserRole.PATIENT,
      createdAt: new Date('2024-02-05'),
      lastLogin: new Date()
    }
  ];

  constructor(private translate: TranslateService) {
    // Vérifier s'il y a un utilisateur stocké au démarrage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    // Simulation d'une authentification avec délai
    return of({}).pipe(
      delay(1000), // Simuler un délai réseau
      map(() => {
        const user = this.mockUsers.find(u => u.email === email);

        if (!user) {
          throw new Error(this.translate.instant('AUTH.USER_NOT_FOUND'));
        }

        // Vérification simple du mot de passe (en production, utiliser bcrypt)
        const validPasswords: Record<string, string> = {
          'admin@alzheimer.fr': 'admin123',
          'soignant@alzheimer.fr': 'soignant123',
          'doctor@alzheimer.fr': 'doctor123',
          'aidant@alzheimer.fr': 'aidant123',
          'patient@alzheimer.fr': 'patient123'
        };

        if (validPasswords[email] !== password) {
          throw new Error(this.translate.instant('AUTH.WRONG_PASSWORD'));
        }

        // Mettre à jour la dernière connexion
        user.lastLogin = new Date();

        // Stocker l'utilisateur
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);

        return {
          user,
          token: 'mock-jwt-token-' + Date.now(),
          expiresIn: 3600
        };
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  hasRole(role: UserRole): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser ? currentUser.role === role : false;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser ? roles.includes(currentUser.role) : false;
  }

  // Rafraîchir le token (simulation)
  refreshToken(): Observable<LoginResponse> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error(this.translate.instant('AUTH.NO_USER_CONNECTED'));
    }

    return of({}).pipe(
      delay(500),
      map(() => ({
        user: currentUser,
        token: 'mock-jwt-token-refreshed-' + Date.now(),
        expiresIn: 3600
      }))
    );
  }

  // Mot de passe oublié (simulation)
  forgotPassword(email: string): Observable<boolean> {
    return of({}).pipe(
      delay(1000),
      map(() => {
        const user = this.mockUsers.find(u => u.email === email);
        if (!user) {
          throw new Error(this.translate.instant('AUTH.EMAIL_NOT_FOUND'));
        }
        // En production, envoyer un email de réinitialisation
        console.log(`Email de réinitialisation envoyé à ${email}`);
        return true;
      })
    );
  }

  // Réinitialiser le mot de passe (simulation)
  resetPassword(token: string, newPassword: string): Observable<boolean> {
    return of({}).pipe(
      delay(1000),
      map(() => {
        // En production, valider le token et mettre à jour le mot de passe
        console.log('Mot de passe réinitialisé avec succès');
        return true;
      })
    );
  }

  // Changer le mot de passe
  changePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error(this.translate.instant('AUTH.NO_USER_CONNECTED'));
    }

    return of({}).pipe(
      delay(1000),
      map(() => {
        // En production, vérifier le mot de passe actuel et mettre à jour
        console.log('Mot de passe changé avec succès');
        return true;
      })
    );
  }

  // Mettre à jour le profil utilisateur
  updateProfile(updates: Partial<User>): Observable<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error(this.translate.instant('AUTH.NO_USER_CONNECTED'));
    }

    return of({}).pipe(
      delay(1000),
      map(() => {
        const updatedUser = { ...currentUser, ...updates };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
        return updatedUser;
      })
    );
  }
}
