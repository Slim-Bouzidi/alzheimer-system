import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SoignantService } from '../soignant.service';
import { NotificationTache } from '../../models/notification-tache.model';

@Component({
  selector: 'app-soignant-notifications-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './soignant-notifications-page.component.html',
  styleUrls: ['../soignant-pages.css']
})
export class SoignantNotificationsPageComponent implements OnInit {
  notifications: NotificationTache[] = [];

  constructor(private soignantService: SoignantService, private router: Router) {}

  ngOnInit(): void {
    this.notifications = this.soignantService.getNotificationsTache();
  }

  marquerFait(id: string): void {
    this.soignantService.marquerNotificationFait(id).subscribe(() => {
      this.notifications = this.soignantService.getNotificationsTache();
    });
  }

  marquerReporter(id: string): void {
    this.soignantService.marquerNotificationReporter(id).subscribe(() => {
      this.notifications = this.soignantService.getNotificationsTache();
    });
  }

  marquerProbleme(id: string): void {
    this.soignantService.marquerNotificationProbleme(id).subscribe(() => {
      this.notifications = this.soignantService.getNotificationsTache();
    });
  }

  logout(): void { this.router.navigate(['/test']); }
}
