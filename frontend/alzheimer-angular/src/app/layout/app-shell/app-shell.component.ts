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
<<<<<<< HEAD
  sidebarCollapsed = false;
=======
  sidebarCollapsed = true;
>>>>>>> cb099be (user ui update)
  readonly sidebarWidth = '280px';
  readonly sidebarCollapsedWidth = '72px';

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }
}
