import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-home-redirect',
    standalone: true,
    imports: [CommonModule],
    template: '<div class="home-redirect-shell"></div>'
})
export class HomeRedirectComponent implements OnInit {
    constructor(
        private readonly router: Router,
        private readonly authService: AuthService
    ) {}

    ngOnInit(): void {
        void this.router.navigateByUrl(this.authService.getHomeRoute(), { replaceUrl: true });
    }
}