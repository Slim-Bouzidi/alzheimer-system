import { Injectable, signal } from '@angular/core';
import keycloak from '../../../keycloak';

export interface UserProfile {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private profileSignal = signal<UserProfile | null>(null);
    readonly profile = this.profileSignal.asReadonly();

    constructor() {
        this.updateProfile();
    }

    private updateProfile(): void {
        if (keycloak.authenticated) {
            const roles = keycloak.realmAccess?.roles || [];
            const username = keycloak.tokenParsed?.['preferred_username'];

            // Set initial profile immediately from token
            this.profileSignal.set({ username, roles });

            // Load the full profile (async) for first/last name
            keycloak.loadUserProfile().then((profile: { email?: string; firstName?: string; lastName?: string }) => {
                const userProfile = {
                    username,
                    email: profile.email,
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    roles
                };
                console.log('[AuthService] User profile loaded:', userProfile);
                this.profileSignal.set(userProfile);
            }).catch((err: unknown) => {
                console.error('Failed to load user profile from Keycloak', err);
            });
        }
    }

    get username(): string | undefined {
        return this.profile()?.username;
    }

    hasRole(role: string): boolean {
        const userRoles = this.profile()?.roles || [];
        // Keycloak roles often don't have the ROLE_ prefix in the token
        return userRoles.includes(role) || userRoles.includes(`ROLE_${role}`);
    }

    isAdmin(): boolean {
        return this.hasRole('ADMIN');
    }

    isStaff(): boolean {
        return this.hasRole('LIVREUR') || this.hasRole('STAFF');
    }

    logout(): void {
        keycloak.logout({ redirectUri: window.location.origin });
    }
}
