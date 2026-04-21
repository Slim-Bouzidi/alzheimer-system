import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SidebarComponent } from '../../../shared/sidebar-portal/sidebar.component';
import { AuthService } from '../../../core/services/alzheimer-app/auth.service';

@Component({
    selector: 'app-doctor-settings',
    standalone: true,
    imports: [CommonModule, SidebarComponent, TranslateModule],
    templateUrl: './doctor-settings.component.html',
    styleUrls: ['./doctor-settings.component.css']
})
export class DoctorSettingsComponent {

    constructor(private router: Router, private translate: TranslateService, private authService: AuthService) {
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
        this.authService.logout();
    }
}
