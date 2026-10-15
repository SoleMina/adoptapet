import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { UserApi } from '@core/api/user-api';
import { UserResponse } from '@core/models/user';
import { Avatar } from '@shared/components/avatar/avatar';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ErrorState } from '@shared/components/error-state/error-state';
import { LoadingState } from '@shared/components/loading-state/loading-state';
import { PanelHeader } from '@shared/components/panel-header/panel-header';
import { valueOf } from '@shared/utils/resource';
import { finalize } from 'rxjs';
import { UserActivation } from '../../users/user-activation';

/** ADMIN: the workers of the shelter, with their accounts. */
@Component({
  selector: 'app-worker-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    PanelHeader,
    Avatar,
    EmptyState,
    ErrorState,
    LoadingState,
  ],
  templateUrl: './worker-list.html',
  styleUrl: './worker-list.scss',
})
export class WorkerList {
  private readonly userApi = inject(UserApi);
  private readonly activation = inject(UserActivation);

  protected readonly workers = rxResource({ stream: () => this.userApi.list('WORKER') });
  protected readonly rows = computed(() => valueOf(this.workers) ?? []);
  /** Worker with an action in progress (its buttons are disabled). */
  protected readonly busyId = signal<number | null>(null);

  /** Deactivating has its own page (with the reason); reactivating is one click. */
  protected activate(worker: UserResponse): void {
    this.busyId.set(worker.id);
    this.activation
      .activate(worker.id)
      .pipe(finalize(() => this.busyId.set(null)))
      .subscribe((updated) =>
        this.workers.update((list) =>
          list?.map((item) => (item.id === updated.id ? updated : item)),
        ),
      );
  }
}
