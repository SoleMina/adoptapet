import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { UserApi } from '@core/api/user-api';
import { AuthStore } from '@core/auth/auth-store';
import { ROLE_LABEL, ROLE_TONE } from '@core/i18n/labels';
import { Role, UserResponse } from '@core/models/user';
import { Avatar } from '@shared/components/avatar/avatar';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { valueOf } from '@shared/utils/resource';
import { finalize } from 'rxjs';
import { UserActivation } from '../user-activation';
import { UserDialog } from '../user-dialog/user-dialog';

const FILTERS: { role: Role | ''; label: string }[] = [
  { role: '', label: 'Todos' },
  { role: 'ADMIN', label: 'Administrador' },
  { role: 'WORKER', label: 'Trabajador' },
  { role: 'ADOPTER', label: 'Adoptante' },
];

/** Staff: the accounts of the system. Read-only for a WORKER; an ADMIN edits and (de)activates them. */
@Component({
  selector: 'app-user-list',
  imports: [MatIconModule, RouterLink, PanelHeader, Avatar, EmptyState, ErrorState],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList {
  private readonly userApi = inject(UserApi);
  private readonly dialog = inject(MatDialog);
  private readonly activation = inject(UserActivation);
  private readonly store = inject(AuthStore);
  protected readonly isAdmin = this.store.isAdmin;

  protected readonly filters = FILTERS;
  protected readonly roleLabel = ROLE_LABEL;
  protected readonly roleTone = ROLE_TONE;
  protected readonly role = signal<Role | ''>('');
  /** User with an action in progress (its buttons are disabled). */
  protected readonly busyId = signal<number | null>(null);

  protected readonly users = rxResource({ stream: () => this.userApi.list() });

  protected readonly rows = computed(() =>
    (valueOf(this.users) ?? []).filter((user) => !this.role() || user.role === this.role()),
  );

  /** The backend forbids deactivating your own account and the administrators. */
  protected canToggle(user: UserResponse): boolean {
    return user.role !== 'ADMIN' && user.id !== this.store.user()?.id;
  }

  protected toggle(user: UserResponse): void {
    this.busyId.set(user.id);
    this.activation
      .toggle(user)
      .pipe(finalize(() => this.busyId.set(null)))
      .subscribe((active) =>
        this.users.update((list) =>
          list?.map((item) => (item.id === user.id ? { ...item, active } : item)),
        ),
      );
  }

  protected open(user: UserResponse): void {
    this.dialog
      .open<UserDialog, UserResponse, UserResponse>(UserDialog, { data: user, maxWidth: '640px' })
      .afterClosed()
      .subscribe((updated) => {
        if (updated) {
          this.users.update((list) =>
            list?.map((item) => (item.id === updated.id ? updated : item)),
          );
        }
      });
  }
}
