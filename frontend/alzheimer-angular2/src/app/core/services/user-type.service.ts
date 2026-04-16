import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { UserType, UserTypeFormValue } from '../models/user-type.model';

const MOCK_DATA: UserType[] = [
  {
    id: 1,
    name: 'System Administrator',
    description: 'Full system access with all administrative privileges',
    level: 10,
    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-06-15'),
  },
  {
    id: 2,
    name: 'Neurologist',
    description: 'Medical specialist with patient data read/write access',
    level: 8,
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-07-20'),
  },
  {
    id: 3,
    name: 'Caregiver',
    description: 'Primary caregiver responsible for daily patient monitoring',
    level: 5,
    isActive: true,
    createdAt: new Date('2024-02-14'),
    updatedAt: new Date('2024-08-01'),
  },
  {
    id: 4,
    name: 'Family Member',
    description: 'Read-only access to assigned patient records',
    level: 2,
    isActive: true,
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-08-05'),
  },
  {
    id: 5,
    name: 'Researcher',
    description: 'Access to anonymized data for research purposes',
    level: 4,
    isActive: false,
    createdAt: new Date('2024-04-12'),
    updatedAt: new Date('2024-09-01'),
  },
  {
    id: 6,
    name: 'Nurse',
    description: 'Clinical staff with monitoring and alert management access',
    level: 6,
    isActive: true,
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-09-15'),
  },
  {
    id: 7,
    name: 'IT Support',
    description: 'Technical support with limited system configuration access',
    level: 3,
    isActive: false,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-10-01'),
  },
];

@Injectable({ providedIn: 'root' })
export class UserTypeService {
  private _store = new BehaviorSubject<UserType[]>([...MOCK_DATA]);
  private _nextId = MOCK_DATA.length + 1;

  readonly userTypes$: Observable<UserType[]> = this._store.asObservable();

  getAll(): Observable<UserType[]> {
    return of([...this._store.getValue()]).pipe(delay(600));
  }

  create(formValue: UserTypeFormValue): Observable<UserType> {
    const now = new Date();
    const newItem: UserType = {
      id: this._nextId++,
      name: formValue.name,
      description: formValue.description,
      level: formValue.level,
      isActive: formValue.isActive,
      createdAt: now,
      updatedAt: now,
    };
    return of(newItem).pipe(
      delay(300),
      tap(item => {
        const current = this._store.getValue();
        this._store.next([...current, item]);
      })
    );
  }

  update(id: number, formValue: UserTypeFormValue): Observable<UserType> {
    const current = this._store.getValue();
    const index = current.findIndex(ut => ut.id === id);
    if (index === -1) throw new Error(`UserType with id ${id} not found`);

    const updated: UserType = {
      ...current[index],
      ...formValue,
      updatedAt: new Date(),
    };
    const next = [...current];
    next[index] = updated;

    return of(updated).pipe(
      delay(300),
      tap(() => this._store.next(next))
    );
  }

  toggleActive(id: number): Observable<UserType> {
    const current = this._store.getValue();
    const index = current.findIndex(ut => ut.id === id);
    if (index === -1) throw new Error(`UserType with id ${id} not found`);

    const updated: UserType = {
      ...current[index],
      isActive: !current[index].isActive,
      updatedAt: new Date(),
    };
    const next = [...current];
    next[index] = updated;

    return of(updated).pipe(
      delay(200),
      tap(() => this._store.next(next))
    );
  }

  delete(id: number): Observable<void> {
    const current = this._store.getValue().filter(ut => ut.id !== id);
    return of(void 0).pipe(
      delay(300),
      tap(() => this._store.next(current))
    );
  }
}
