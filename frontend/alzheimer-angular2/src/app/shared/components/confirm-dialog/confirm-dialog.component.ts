import {
  Component,
  EventEmitter,
  Input,
  Output,
  HostListener,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent implements OnChanges, AfterViewChecked {
  @Input() title = 'Confirmer';
  @Input() message = '';
  @Input() confirmText = 'Confirmer';
  @Input() cancelText = 'Annuler';
  @Input() confirmDanger = false;
  @Output() confirmed = new EventEmitter<boolean>();

  @ViewChild('confirmBtn') confirmBtnRef?: ElementRef<HTMLButtonElement>;

  private focusPending = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']?.currentValue) this.focusPending = true;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.cancel();
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnter(event: Event): void {
    const ev = event as KeyboardEvent;
    if (!this.isOpen()) return;
    const target = ev.target as HTMLElement;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
    ev.preventDefault();
    this.confirm();
  }

  isOpen(): boolean {
    return !!this.message;
  }

  cancel(): void {
    this.confirmed.emit(false);
  }

  confirm(): void {
    this.confirmed.emit(true);
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('confirm-dialog-overlay')) {
      this.cancel();
    }
  }

  ngAfterViewChecked(): void {
    if (this.focusPending && this.message && this.confirmBtnRef?.nativeElement) {
      this.focusPending = false;
      setTimeout(() => this.confirmBtnRef?.nativeElement?.focus(), 50);
    }
  }

}
