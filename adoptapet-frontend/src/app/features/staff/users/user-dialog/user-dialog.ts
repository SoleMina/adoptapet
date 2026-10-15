import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ROLE_LABEL, ROLE_TONE } from '@core/i18n/labels';
import { UserResponse } from '@core/models/user';
import { Avatar } from '@shared/components/avatar/avatar';
import { LimaDatePipe } from '@shared/pipes/lima-date-pipe';

/** Read-only sheet of one user, for a WORKER (an ADMIN edits and deactivates from the lists). */
@Component({
  selector: 'app-user-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, RouterLink, Avatar, LimaDatePipe],
  templateUrl: './user-dialog.html',
  styleUrl: './user-dialog.scss',
})
export class UserDialog {
  private readonly dialogRef = inject<MatDialogRef<UserDialog, UserResponse>>(MatDialogRef);

  protected readonly user = signal(inject<UserResponse>(MAT_DIALOG_DATA));
  protected readonly roleLabel = ROLE_LABEL;
  protected readonly roleTone = ROLE_TONE;
  protected close(): void {
    this.dialogRef.close();
  }
}
