import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputSwitchModule } from 'primeng/inputswitch';
import { SliderModule } from 'primeng/slider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';

import { UserType, UserTypeDialogMode, UserTypeFormValue } from '../../../core/models/user-type.model';
import { UserTypeService } from '../../../core/services/user-type.service';

@Component({
  selector: 'app-user-type-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    InputSwitchModule,
    SliderModule,
    MessageModule,
  ],
  templateUrl: './user-type-dialog.component.html',
  styleUrl: './user-type-dialog.component.scss',
})
export class UserTypeDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() mode: UserTypeDialogMode = 'create';
  @Input() userType: UserType | null = null;
  @Input() initialData: Partial<UserTypeFormValue> | null = null;

  @Output() saved = new EventEmitter<UserType>();
  @Output() closed = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly userTypeService = inject(UserTypeService);
  private readonly messageService = inject(MessageService);

  saving = false;

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(200)]],
    level: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    isActive: [true],
  });

  get title(): string {
    return this.mode === 'create' ? 'Create User Type' : 'Edit User Type';
  }

  get nameControl() { return this.form.get('name')!; }
  get descriptionControl() { return this.form.get('description')!; }
  get levelControl() { return this.form.get('level')!; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      const defaults = { name: '', description: '', level: 5, isActive: true };
      this.form.reset({ ...defaults, ...(this.initialData || {}) });
      
      if (this.mode === 'edit' && this.userType) {
        this.form.patchValue({
          name: this.userType.name,
          description: this.userType.description,
          level: this.userType.level,
          isActive: this.userType.isActive,
        });
      }
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formValue = this.form.value as UserTypeFormValue;

    const obs = this.mode === 'create'
      ? this.userTypeService.create(formValue)
      : this.userTypeService.update(this.userType!.id, formValue);

    obs.subscribe({
      next: saved => {
        this.saving = false;
        this.saved.emit(saved);
      },
      error: () => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Operation failed.' });
      },
    });
  }

  onClose(): void {
    this.closed.emit();
  }

  hasError(controlName: string, errorKey: string): boolean {
    const ctrl = this.form.get(controlName);
    return !!(ctrl?.hasError(errorKey) && ctrl.touched);
  }

  getLevelLabel(level: number): string {
    if (level <= 2) return 'Observer';
    if (level <= 4) return 'Standard';
    if (level <= 6) return 'Elevated';
    if (level <= 8) return 'Manager';
    return 'Administrator';
  }
}
