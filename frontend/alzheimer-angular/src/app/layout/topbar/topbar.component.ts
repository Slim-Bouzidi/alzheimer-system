import { Component, input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import keycloak from '../../keycloak';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ViewChild } from '@angular/core';
import { UserCreateDialogComponent } from '../../features/manage-users/user-create-dialog/user-create-dialog.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TooltipModule, UserCreateDialogComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  /** Left offset (e.g. '280px' or '72px') so topbar stays in sync with sidebar expand/collapse */
  sidebarOffset = input<string>('280px');

  @HostBinding('style.left') get leftOffset(): string {
    return this.sidebarOffset();
  }

  searchValue = '';

  @ViewChild('createDialog') createDialog!: UserCreateDialogComponent;

  onAddUser(): void {
    console.log('[Topbar] Add User clicked');
    if (this.createDialog) {
      console.log('[Topbar] Calling createDialog.show()');
      this.createDialog.show();
    } else {
      console.error('[Topbar] createDialog is UNDEFINED! Check ViewChild reference.');
    }
  }
}
