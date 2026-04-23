import { Injectable, NgZone, signal } from '@angular/core';
import keycloak from '../keycloak';

export interface UserProfile {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roles: string[];
}

export interface RoleHomeOption {
    role: string;
    label: string;
    route: string;
    icon: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly profileSignal = signal<UserProfile | null>(null);
    readonly profile = this.profileSignal.asReadonly();
    private refreshIntervalId: number | null = null;
    private profileEndpointEnabled = false;
    private readonly rolePriority = ['ADMIN', 'DOCTOR', 'SOIGNANT', 'CAREGIVER', 'LIVREUR', 'PATIENT'] as const;

    constructor(private readonly ngZone: NgZone) {
        void this.refreshProfile();
        this.registerKeycloakHooks();
        this.startTokenRefreshLoop();
    }

    get username(): string | undefined {
        return this.profile()?.username;
    }

    getCurrentUser(): UserProfile | null {
        return this.profile();
    }

    getPrimaryRole(): string | null {
        const roles = this.getEffectiveRoles();

        for (const role of this.rolePriority) {
            if (roles.includes(role)) {
                return role;
            }
        }

        return roles[0] ?? null;
    }

    getDisplayName(prefixDoctor: boolean = false): string {
        const profile = this.getCurrentUser();
        const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();

        if (fullName) {
            return prefixDoctor && this.isDoctor() ? `Dr. ${fullName}` : fullName;
        }

        return profile?.username ?? 'Utilisateur';
    }

    getRoleDisplayName(): string {
        if (this.isAdmin()) return 'Administrateur';
        if (this.isDoctor()) return 'Médecin Référent';
        if (this.isSoignant()) return 'Soignant';
        if (this.isCaregiver()) return 'Aidant';
        if (this.isLivreur()) return 'Livreur';
        if (this.isPatient()) return 'Patient';
        return 'Utilisateur';
    }

    getHomeRoute(): string {
        switch (this.getPrimaryRole()) {
            case 'ADMIN':
                return '/admin-dashboard';
            case 'DOCTOR':
                return '/doctor-dashboard';
            case 'SOIGNANT':
                return '/soignant-dashboard';
            case 'CAREGIVER':
                return '/caregiver-dashboard';
            case 'LIVREUR':
                return '/livreur-dashboard';
            case 'PATIENT':
                return '/patient-dashboard';
            default:
                return '/profile';
        }
    }

    getRoleHomeOptions(): RoleHomeOption[] {
        const options: RoleHomeOption[] = [];

        if (this.isAdmin()) {
            options.push({ role: 'ADMIN', label: 'Administration', route: '/admin-dashboard', icon: '🛠️' });
        }
        if (this.isDoctor()) {
            options.push({ role: 'DOCTOR', label: 'Espace Médecin', route: '/doctor-dashboard', icon: '🩺' });
        }
        if (this.isSoignant()) {
            options.push({ role: 'SOIGNANT', label: 'Espace Soignant', route: '/soignant-dashboard', icon: '👩‍⚕️' });
        }
        if (this.isCaregiver()) {
            options.push({ role: 'CAREGIVER', label: 'Espace Aidant', route: '/caregiver-dashboard', icon: '🤝' });
        }
        if (this.isLivreur()) {
            options.push({ role: 'LIVREUR', label: 'Espace Livreur', route: '/livreur-dashboard', icon: '🚚' });
        }
        if (this.isPatient()) {
            options.push({ role: 'PATIENT', label: 'Espace Patient', route: '/patient-dashboard', icon: '❤️' });
        }

        return options;
    }

    isLoggedIn(): boolean {
        return !!keycloak.authenticated;
    }

    hasRole(role: string): boolean {
        const normalizedRole = role.toUpperCase();
        return this.getEffectiveRoles().includes(normalizedRole);
    }

    hasAnyRole(roles: string[]): boolean {
        return roles.some((role) => this.hasRole(role));
    }

    isAdmin(): boolean {
        return this.hasRole('ADMIN');
    }

    isDoctor(): boolean {
        return this.hasRole('DOCTOR');
    }

    isCaregiver(): boolean {
        return this.hasRole('CAREGIVER');
    }

    isSoignant(): boolean {
        return this.hasRole('SOIGNANT');
    }

    isLivreur(): boolean {
        return this.hasRole('LIVREUR');
    }

    isPatient(): boolean {
        return this.hasRole('PATIENT');
    }

    isStaff(): boolean {
        return this.isLivreur() || this.isSoignant() || this.isDoctor() || this.isCaregiver();
    }

    async login(redirectUri: string = window.location.href): Promise<void> {
        await keycloak.login({ redirectUri });
    }

    async logout(redirectUri: string = window.location.origin): Promise<void> {
        this.stopTokenRefreshLoop();
        await keycloak.logout({ redirectUri });
    }

    async refreshToken(minValiditySeconds: number = 60): Promise<boolean> {
        if (!keycloak.authenticated) {
            return false;
        }

        const refreshed = await keycloak.updateToken(minValiditySeconds);
        await this.refreshProfile();
        return refreshed;
    }

    async refreshProfile(): Promise<void> {
        if (!keycloak.authenticated) {
            this.profileSignal.set(null);
            return;
        }

        const tokenProfile = this.buildProfileFromToken();
        this.profileSignal.set(tokenProfile);

        if (!this.profileEndpointEnabled) {
            return;
        }

        try {
            const loadedProfile = await keycloak.loadUserProfile();
            this.profileSignal.set({
                ...tokenProfile,
                email: loadedProfile.email ?? tokenProfile.email,
                firstName: loadedProfile.firstName ?? tokenProfile.firstName,
                lastName: loadedProfile.lastName ?? tokenProfile.lastName,
            });
        } catch (err) {
            if (this.isNonRecoverableProfileError(err)) {
                this.profileEndpointEnabled = false;
                console.warn('Keycloak account profile endpoint unavailable. Falling back to token claims only.');
                return;
            }

            console.error('Failed to load user profile from Keycloak', err);
        }
    }

    private isNonRecoverableProfileError(err: unknown): boolean {
        const maybeStatus = (err as { status?: unknown })?.status;
        const status = typeof maybeStatus === 'number' ? maybeStatus : null;
        return status === 401 || status === 403 || err instanceof TypeError;
    }

    private registerKeycloakHooks(): void {
        keycloak.onAuthSuccess = () => {
            void this.runInAngular(async () => {
                await this.refreshProfile();
                this.startTokenRefreshLoop();
            });
        };

        keycloak.onAuthRefreshSuccess = () => {
            void this.runInAngular(async () => {
                await this.refreshProfile();
            });
        };

        keycloak.onAuthLogout = () => {
            this.runInAngular(() => {
                this.stopTokenRefreshLoop();
                this.profileSignal.set(null);
            });
        };

        keycloak.onTokenExpired = () => {
            void this.runInAngular(async () => {
                try {
                    await this.refreshToken();
                } catch (err) {
                    console.error('Automatic token refresh failed', err);
                    await this.login(window.location.href);
                }
            });
        };
    }

    private buildProfileFromToken(): UserProfile {
        const tokenParsed = keycloak.tokenParsed as Record<string, unknown> | undefined;
        return {
            username: typeof tokenParsed?.['preferred_username'] === 'string' ? tokenParsed['preferred_username'] : undefined,
            email: typeof tokenParsed?.['email'] === 'string' ? tokenParsed['email'] : undefined,
            firstName: typeof tokenParsed?.['given_name'] === 'string' ? tokenParsed['given_name'] : undefined,
            lastName: typeof tokenParsed?.['family_name'] === 'string' ? tokenParsed['family_name'] : undefined,
            roles: this.getEffectiveRoles(),
        };
    }

    private getEffectiveRoles(): string[] {
        const defaultRoles = new Set(['OFFLINE_ACCESS', 'UMA_AUTHORIZATION']);
        const collectedRoles = new Set<string>();

        for (const role of keycloak.realmAccess?.roles ?? []) {
            const normalizedRole = role.toUpperCase();
            if (!defaultRoles.has(normalizedRole) && !normalizedRole.startsWith('DEFAULT-ROLES-')) {
                collectedRoles.add(normalizedRole);
            }
        }

        for (const access of Object.values(keycloak.resourceAccess ?? {})) {
            for (const role of access.roles ?? []) {
                const normalizedRole = role.toUpperCase();
                if (!defaultRoles.has(normalizedRole) && !normalizedRole.startsWith('DEFAULT-ROLES-')) {
                    collectedRoles.add(normalizedRole);
                }
            }
        }

        return Array.from(collectedRoles);
    }

    private startTokenRefreshLoop(): void {
        if (!keycloak.authenticated || typeof window === 'undefined' || this.refreshIntervalId !== null) {
            return;
        }

        this.ngZone.runOutsideAngular(() => {
            this.refreshIntervalId = window.setInterval(() => {
                void keycloak.updateToken(60).catch((err) => {
                    console.error('Background token refresh failed', err);
                });
            }, 30000);
        });
    }

    private stopTokenRefreshLoop(): void {
        if (this.refreshIntervalId !== null && typeof window !== 'undefined') {
            window.clearInterval(this.refreshIntervalId);
            this.refreshIntervalId = null;
        }
    }

    private runInAngular<T>(callback: () => T): T {
        return this.ngZone.run(callback);
    }
}
