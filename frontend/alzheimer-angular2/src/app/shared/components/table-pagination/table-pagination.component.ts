import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-table-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="table-pagination" *ngIf="totalItems > 0">
      <div class="table-pagination__meta">
        <span class="table-pagination__range">
          {{ startItem }}-{{ endItem }} / {{ totalItems }}
        </span>
        <label class="table-pagination__size">
          <span>Rows</span>
          <select
            class="form-input form-select table-pagination__select"
            [ngModel]="pageSize"
            (ngModelChange)="onPageSizeSelected($event)"
          >
            <option *ngFor="let size of pageSizeOptions" [ngValue]="size">{{ size }}</option>
          </select>
        </label>
      </div>

      <div class="table-pagination__controls">
        <button
          type="button"
          class="btn-outline btn-sm"
          (click)="goToPrevious()"
          [disabled]="currentPage <= 1"
        >
          Previous
        </button>

        <button
          *ngFor="let page of pages"
          type="button"
          class="btn-outline btn-sm table-pagination__page"
          [class.table-pagination__page--active]="page === currentPage"
          (click)="goToPage(page)"
        >
          {{ page }}
        </button>

        <button
          type="button"
          class="btn-outline btn-sm"
          (click)="goToNext()"
          [disabled]="currentPage >= totalPages"
        >
          Next
        </button>
      </div>
    </div>
  `,
})
export class TablePaginationComponent {
  @Input() totalItems = 0;
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 20];
  @Output() currentPageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  goToPrevious(): void {
    this.goToPage(this.currentPage - 1);
  }

  goToNext(): void {
    this.goToPage(this.currentPage + 1);
  }

  goToPage(page: number): void {
    const safePage = Math.min(Math.max(1, page), this.totalPages);
    if (safePage === this.currentPage) return;
    this.currentPageChange.emit(safePage);
  }

  onPageSizeSelected(rawSize: unknown): void {
    const size = Number(rawSize);
    if (!Number.isFinite(size) || size <= 0 || size === this.pageSize) return;
    this.pageSizeChange.emit(size);
  }
}
