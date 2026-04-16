import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { WebSocketService } from '../../services/websocket.service';
import { NotificationService } from '../../services/notification.service';
import { SupportNotification } from '../../models/support-notification.model';
import { TablePaginationComponent } from '../../shared/components/table-pagination/table-pagination.component';

@Component({
  selector: 'app-soignant-notifications-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, TablePaginationComponent],
  templateUrl: './soignant-notifications-page.component.html',
  styleUrls: ['../soignant-pages.css']
})
export class SoignantNotificationsPageComponent implements OnInit, OnDestroy {
  notifications: SupportNotification[] = [];
  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 20];
  loading = false;
  selectedMemberId = Number(localStorage.getItem('supportNetwork.selectedMemberId') ?? '2');
  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private websocketService: WebSocketService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.websocketService.watchNotifications(this.selectedMemberId);
    this.subscriptions.push(
      this.websocketService.onNotification().subscribe((event) => {
        const memberId =
          event && typeof event === 'object' && 'memberId' in (event as Record<string, unknown>)
            ? Number((event as Record<string, unknown>)['memberId'])
            : null;
        if (memberId == null || memberId !== this.selectedMemberId) {
          return;
        }
        console.log('📩 WS notification:', event);
        this.toastr.info('New notification');
        this.loadNotifications();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
  }

  onMemberChange(memberId: number): void {
    this.selectedMemberId = Number(memberId);
    this.currentPage = 1;
    localStorage.setItem('supportNetwork.selectedMemberId', String(this.selectedMemberId));
    this.websocketService.watchNotifications(this.selectedMemberId);
    this.loadNotifications();
  }

  markAsRead(id: number): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => this.loadNotifications(),
      error: () => this.toastr.error('Could not mark as read'),
    });
  }

  unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  private loadNotifications(): void {
    this.loading = true;
    this.notificationService.getMemberNotifications(this.selectedMemberId).subscribe({
      next: (rows) => {
        this.notifications = rows ?? [];
        this.currentPage = 1;
        this.loading = false;
      },
      error: () => {
        this.notifications = [];
        this.loading = false;
      },
    });
  }

  logout(): void { this.router.navigate(['/test']); }

  get pagedNotifications(): SupportNotification[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.notifications.slice(start, start + this.pageSize);
  }

  onNotificationsPageChange(page: number): void {
    this.currentPage = page;
  }

  onNotificationsPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }
}
