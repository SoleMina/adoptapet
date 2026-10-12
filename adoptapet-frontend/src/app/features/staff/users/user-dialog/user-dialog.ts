import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { UserApi } from '@core/api/user-api';
import { AuthStore } from '@core/auth/auth-store';
import { ApiError } from '@core/errors/api-error';
import { ROLE_LABEL, ROLE_TONE } from '@core/i18n/labels';
import { UserResponse } from '@core/models/user';
import { Notify } from '@core/ui/notify';
import { Avatar } from '@shared/components/avatar/avatar';
import { LimaDatePipe } from '@shared/pipes/lima-date-pipe';

/**
 * Sheet of one user. Everyone in the staff can read it; an ADMIN can also deactivate or reactivate the
 * account (never their own, never another administrator: the backend forbids both).
 * Closes with the updated user when something changed.
 */
@Component({
  selector: 'app-user-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, RouterLink, Avatar, LimaDatePipe],
  templateUrl: './user-dialog.html',
  styleUrl: './user-dialog.scss',
})
export class UserDialog {
  private readonly dialogRef = inject<MatDialogRef<UserDialog, UserResponse>>(MatDialogRef);
  private readonly userApi = inject(UserApi);
  private readonly auth = inject(AuthStore);
  private readonly notify = inject(Notify);

  protected readonly user = signal(inject<UserResponse>(MAT_DIALOG_DATA));
  protected readonly roleLabel = ROLE_LABEL;
  protected readonly roleTone = ROLE_TONE;
  protected readonly saving = signal(false);
  private changed = false;

  protected readonly canToggle = computed(() => {
    const user = this.user();
    return this.auth.isAdmin() && user.role !== 'ADMIN' && user.id !== this.auth.user()?.id;
  });

  protected toggleActive(): void {
    const user = this.user();
    this.saving.set(true);
    this.userApi.setActive(user.id, !user.active).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.changed = true;
        this.user.set(updated);
        this.notify.success(updated.active ? 'Cuenta reactivada' : 'Cuenta desactivada');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        if (error instanceof ApiError && !error.notified) {
          error.notified = true;
          this.notify.error(error.message);
        }
      },
    });
  }

  protected close(): void {
    this.dialogRef.close(this.changed ? this.user() : undefined);
  }
}
