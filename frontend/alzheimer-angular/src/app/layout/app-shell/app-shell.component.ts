import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule, SidebarComponent, TopbarComponent],
  providers: [MessageService, ConfirmationService],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  sidebarCollapsed = true;
  /** Keep in sync with `--sidebar-width` / `--sidebar-collapsed-width` in global styles */
  readonly sidebarWidth = 'var(--sidebar-width)';
  readonly sidebarCollapsedWidth = 'var(--sidebar-collapsed-width)';

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }
}
