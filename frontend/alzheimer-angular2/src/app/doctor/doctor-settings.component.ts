import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-doctor-settings',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './doctor-settings.component.html',
    styleUrls: ['./doctor-settings.component.css']
})
export class DoctorSettingsComponent implements OnInit {

    constructor(
        private router: Router,
        private translate: TranslateService,
        private authService: AuthService
    ) {
        this.userInfo.specialization = this.translate.instant('DOCTOR.SPECIALIZATION_GERIATRICS');
        this.securitySettings.lastPasswordChange = this.translate.instant('DOCTOR.LAST_PASSWORD_CHANGE_3_MONTHS');
    }

    activeTab: string = 'profile';

    userInfo = {
        name: 'Dr. Marie Martin',
        email: 'marie.martin@medassist.com',
        specialization: 'Geriatrics',
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
        lastPasswordChange: '3 months ago'
    };

    ngOnInit(): void {
        const profile = this.authService.getCurrentUser();
        const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();

        if (fullName) {
            this.userInfo.name = `Dr. ${fullName}`;
        }

        if (profile?.email) {
            this.userInfo.email = profile.email;
        }
    }

    async logout(): Promise<void> {
        await this.authService.logout();
    }
}
