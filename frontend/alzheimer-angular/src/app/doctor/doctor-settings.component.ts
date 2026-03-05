import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { NotificationBellComponent } from '../shared/components/notification-bell/notification-bell.component';
import keycloak from '../keycloak';

@Component({
    selector: 'app-doctor-settings',
    standalone: true,
    imports: [CommonModule, SidebarComponent, NotificationBellComponent, TranslateModule],
    templateUrl: './doctor-settings.component.html',
    styleUrls: ['./doctor-settings.component.css']
})
export class DoctorSettingsComponent {

    userName = keycloak.tokenParsed?.['name'] || keycloak.tokenParsed?.['preferred_username'] || 'Médecin';

    constructor(private router: Router, private translate: TranslateService) {
        this.userInfo.specialization = this.translate.instant('DOCTOR.SPECIALIZATION_GERIATRICS');
        this.securitySettings.lastPasswordChange = this.translate.instant('DOCTOR.LAST_PASSWORD_CHANGE_3_MONTHS');
    }

    activeTab: string = 'profile';

    userInfo = {
        name: 'Dr. Marie Martin',
        email: 'marie.martin@medassist.com',
        specialization: 'Gériatrie',
        license: 'MD-12345-FR'
    };

    notificationSettings = {
        email: true,
        sms: false,
        push: true,
        digest: 'daily'
    };

    securitySettings = {
        twoFactor: true,
        lastPasswordChange: 'Il y a 3 mois'
    };

    logout(): void {
        import('../keycloak').then(m => m.default.logout({ redirectUri: window.location.origin }));
    }
}
