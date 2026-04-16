export interface UserType {
  id: number;
  name: string;
  description: string;
  level: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserTypeDialogMode = 'create' | 'edit';

export interface UserTypeFormValue {
  name: string;
  description: string;
  level: number;
  isActive: boolean;
}
